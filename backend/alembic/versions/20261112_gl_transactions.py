"""Register existing GL transaction tables and add the Cost Element master."""

from alembic import op

from app.modules.gl.models import (
    ContraEntry,
    CostElement,
    CreditNote,
    CreditNoteAccount,
    CreditNoteItem,
    DebitNote,
    DebitNoteAccount,
    DebitNoteItem,
    JournalEntry,
    JournalEntryItem,
)

revision = "20261112_gl_transactions"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    tables = (
        ContraEntry.__table__,
        JournalEntry.__table__,
        JournalEntryItem.__table__,
        CreditNote.__table__,
        CreditNoteItem.__table__,
        CreditNoteAccount.__table__,
        DebitNote.__table__,
        DebitNoteItem.__table__,
        DebitNoteAccount.__table__,
        CostElement.__table__,
    )
    for table in tables:
        table.create(bind=bind, checkfirst=True)


def downgrade() -> None:
    # Keep created master and transaction data; this migration is intentionally additive.
    pass
