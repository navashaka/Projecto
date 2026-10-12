import os
import json
import unittest
from unittest.mock import patch

from fastapi import HTTPException
from fastapi.exceptions import RequestValidationError
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from starlette.requests import Request
from starlette.responses import PlainTextResponse

from app.api.deps import authenticate_admin
from app.api.v1 import admin_records
from app.api.v1.admin_records import RESOURCE_MODELS, router as admin_records_router
from app.api.v1.auth import (
    LoginRequest,
    PasswordChangeRequest,
    change_password,
    login,
    logout_admin,
)
from app.core.security import create_admin_token, decode_admin_token, verify_password
from app.main import hide_passwords_from_validation_errors, protect_record_management
from app.hr.recruitment.models import UserEnquiry
from app.models.admin_credential import AdminCredential


AUTH_ENVIRONMENT = {
    "ADMIN_EMAIL": "admin@example.com",
    "ADMIN_PASSWORD": "Temporary-Password-123",
    "AUTH_SECRET": "test-signing-key-with-at-least-32-bytes",
}


class AdminAuthenticationTests(unittest.IsolatedAsyncioTestCase):
    def setUp(self) -> None:
        self.engine = create_engine("sqlite://")
        AdminCredential.__table__.create(self.engine)
        self.db = Session(self.engine)

    def tearDown(self) -> None:
        self.db.close()
        self.engine.dispose()

    @patch.dict(os.environ, AUTH_ENVIRONMENT)
    def test_first_login_seeds_hash_and_requires_password_change(self) -> None:
        response = login(
            LoginRequest(
                email="ADMIN@example.com",
                password=AUTH_ENVIRONMENT["ADMIN_PASSWORD"],
            ),
            self.db,
        )

        self.assertEqual(response.role, "admin")
        self.assertEqual(response.email, AUTH_ENVIRONMENT["ADMIN_EMAIL"])
        self.assertTrue(response.must_change_password)
        credential = self.db.get(AdminCredential, 1)
        self.assertIsNotNone(credential)
        self.assertNotEqual(credential.password_hash, AUTH_ENVIRONMENT["ADMIN_PASSWORD"])
        self.assertTrue(verify_password(AUTH_ENVIRONMENT["ADMIN_PASSWORD"], credential.password_hash))
        claims = authenticate_admin(f"Bearer {response.access_token}", self.db, allow_password_change=True)
        self.assertEqual(claims["sub"], AUTH_ENVIRONMENT["ADMIN_EMAIL"])
        with self.assertRaises(HTTPException) as blocked:
            authenticate_admin(f"Bearer {response.access_token}", self.db)
        self.assertEqual(blocked.exception.status_code, 403)

    @patch.dict(os.environ, AUTH_ENVIRONMENT)
    def test_password_change_is_persistent_and_does_not_reseed_from_environment(self) -> None:
        first_login = login(
            LoginRequest(email="admin@example.com", password=AUTH_ENVIRONMENT["ADMIN_PASSWORD"]),
            self.db,
        )
        claims = authenticate_admin(
            f"Bearer {first_login.access_token}",
            self.db,
            allow_password_change=True,
        )
        changed = change_password(
            PasswordChangeRequest(
                current_password=AUTH_ENVIRONMENT["ADMIN_PASSWORD"],
                new_password="Better-New-Password-456",
                confirm_new_password="Better-New-Password-456",
            ),
            claims,
            self.db,
        )
        self.assertFalse(changed.must_change_password)
        with self.assertRaises(HTTPException) as old_password:
            login(
                LoginRequest(email="admin@example.com", password=AUTH_ENVIRONMENT["ADMIN_PASSWORD"]),
                self.db,
            )
        self.assertEqual(old_password.exception.status_code, 401)

        self.db.close()
        self.db = Session(self.engine)
        persisted_login = login(
            LoginRequest(email="ADMIN@example.com", password="Better-New-Password-456"),
            self.db,
        )
        self.assertFalse(persisted_login.must_change_password)
        self.assertEqual(persisted_login.email, AUTH_ENVIRONMENT["ADMIN_EMAIL"])

    @patch.dict(os.environ, AUTH_ENVIRONMENT)
    def test_password_change_validates_current_confirmation_and_policy(self) -> None:
        signed_in = login(
            LoginRequest(email="admin@example.com", password=AUTH_ENVIRONMENT["ADMIN_PASSWORD"]),
            self.db,
        )
        claims = authenticate_admin(
            f"Bearer {signed_in.access_token}",
            self.db,
            allow_password_change=True,
        )
        with self.assertRaises(HTTPException) as wrong_current:
            change_password(
                PasswordChangeRequest(
                    current_password="wrong",
                    new_password="Good-Password-456",
                    confirm_new_password="Good-Password-456",
                ),
                claims,
                self.db,
            )
        self.assertEqual(wrong_current.exception.status_code, 400)

        with self.assertRaises(HTTPException) as mismatch:
            change_password(
                PasswordChangeRequest(
                    current_password=AUTH_ENVIRONMENT["ADMIN_PASSWORD"],
                    new_password="Good-Password-456",
                    confirm_new_password="Different-Password-456",
                ),
                claims,
                self.db,
            )
        self.assertEqual(mismatch.exception.status_code, 422)

        with self.assertRaises(HTTPException) as weak_password:
            change_password(
                PasswordChangeRequest(
                    current_password=AUTH_ENVIRONMENT["ADMIN_PASSWORD"],
                    new_password="short",
                    confirm_new_password="short",
                ),
                claims,
                self.db,
            )
        self.assertEqual(weak_password.exception.status_code, 422)

    @patch.dict(os.environ, AUTH_ENVIRONMENT)
    def test_invalid_credentials_non_admin_tokens_and_tampering_are_rejected(self) -> None:
        with self.assertRaises(HTTPException) as bad_password:
            login(LoginRequest(email="admin@example.com", password="wrong"), self.db)
        self.assertEqual(bad_password.exception.status_code, 401)

        signed_in = login(
            LoginRequest(email="admin@example.com", password=AUTH_ENVIRONMENT["ADMIN_PASSWORD"]),
            self.db,
        )
        regular_token = create_admin_token("regular@example.com", 0)
        with self.assertRaises(HTTPException) as non_admin:
            authenticate_admin(f"Bearer {regular_token}", self.db)
        self.assertEqual(non_admin.exception.status_code, 401)

        with self.assertRaises(HTTPException) as missing:
            authenticate_admin(None, self.db)
        self.assertEqual(missing.exception.status_code, 401)

        with self.assertRaises(HTTPException) as invalid:
            decode_admin_token(signed_in.access_token + "tampered")
        self.assertEqual(invalid.exception.status_code, 401)

    @patch.dict(os.environ, AUTH_ENVIRONMENT)
    def test_logout_revokes_existing_tokens(self) -> None:
        signed_in = login(
            LoginRequest(email="admin@example.com", password=AUTH_ENVIRONMENT["ADMIN_PASSWORD"]),
            self.db,
        )
        claims = authenticate_admin(
            f"Bearer {signed_in.access_token}",
            self.db,
            allow_password_change=True,
        )
        logout_admin(claims, self.db)
        with self.assertRaises(HTTPException) as revoked:
            authenticate_admin(
                f"Bearer {signed_in.access_token}",
                self.db,
                allow_password_change=True,
            )
        self.assertEqual(revoked.exception.status_code, 401)

    @patch.dict(os.environ, AUTH_ENVIRONMENT)
    def test_expired_token_is_rejected(self) -> None:
        with patch("app.core.security.time.time", return_value=1000):
            token = create_admin_token("admin@example.com", 0)
        with patch("app.core.security.time.time", return_value=4601):
            with self.assertRaises(HTTPException) as expired:
                authenticate_admin(f"Bearer {token}", self.db)
        self.assertEqual(expired.exception.status_code, 401)

    def test_every_admin_record_endpoint_uses_the_admin_dependency(self) -> None:
        from app.api.deps import require_admin

        self.assertEqual(
            admin_records_router.dependencies[0].dependency,
            require_admin,
        )
        self.assertIn("user-enquiries", RESOURCE_MODELS["hr"])
        self.assertIn("groups", RESOURCE_MODELS["gl"])
        self.assertIn("unit-of-measures", RESOURCE_MODELS["inventory"])
        for resources in RESOURCE_MODELS.values():
            for _, model in resources.values():
                admin_records._update_schema(model)

    def test_updates_and_deletes_target_only_the_selected_record(self) -> None:
        UserEnquiry.__table__.create(self.engine)
        with Session(self.engine) as db:
            first = UserEnquiry(candidate_name="First")
            second = UserEnquiry(candidate_name="Second")
            db.add_all([first, second])
            db.commit()
            db.refresh(first)
            db.refresh(second)
            first_id = first.id
            second_id = second.id

            updated = admin_records.update_record(
                "hr",
                "user-enquiries",
                first_id,
                {"candidate_name": "Updated"},
                db,
            )
            self.assertEqual(updated["id"], first_id)
            self.assertEqual(updated["candidate_name"], "Updated")
            self.assertEqual(db.get(UserEnquiry, second_id).candidate_name, "Second")

            response = admin_records.delete_record("hr", "user-enquiries", first_id, db)
            self.assertEqual(response.status_code, 204)
            self.assertIsNone(db.get(UserEnquiry, first_id))
            self.assertEqual(db.get(UserEnquiry, second_id).candidate_name, "Second")

    async def test_existing_record_mutations_are_protected(self) -> None:
        async def continue_request(_request: Request) -> PlainTextResponse:
            return PlainTextResponse("ok")

        request = Request(
            {
                "type": "http",
                "method": "PUT",
                "path": "/gl-groups/1",
                "headers": [(b"host", b"testserver")],
                "server": ("testserver", 80),
                "scheme": "http",
                "query_string": b"",
            }
        )
        response = await protect_record_management(request, continue_request)
        self.assertEqual(response.status_code, 401)

    async def test_existing_form_submission_remains_public(self) -> None:
        async def continue_request(_request: Request) -> PlainTextResponse:
            return PlainTextResponse("ok")

        request = Request(
            {
                "type": "http",
                "method": "POST",
                "path": "/gl-groups/",
                "headers": [(b"host", b"testserver")],
                "server": ("testserver", 80),
                "scheme": "http",
                "query_string": b"",
            }
        )
        response = await protect_record_management(request, continue_request)
        self.assertEqual(response.status_code, 200)

    async def test_password_validation_errors_do_not_echo_submitted_secret(self) -> None:
        request = Request(
            {
                "type": "http",
                "method": "POST",
                "path": "/api/v1/auth/login",
                "headers": [],
                "server": ("testserver", 80),
                "scheme": "http",
                "query_string": b"",
            }
        )
        error = RequestValidationError(
            [
                {
                    "loc": ("body", "password"),
                    "msg": "String should have at most 1024 characters",
                    "type": "string_too_long",
                    "input": "private-password",
                }
            ]
        )
        response = await hide_passwords_from_validation_errors(request, error)
        content = response.body.decode("utf-8")
        self.assertNotIn("private-password", content)
        self.assertNotIn('"input"', content)
        self.assertEqual(response.status_code, 422)


if __name__ == "__main__":
    unittest.main()
