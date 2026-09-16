from pydantic import BaseModel


class AttendanceCreate(BaseModel):
    user_id: int
    cl: int = 0
    el: int = 0
    pl: int = 0
    lop: int = 0
    nh: int = 0
    sundays: int = 0
    other_paid_days: int = 0
    net_present_days: int


class AttendanceUpdate(BaseModel):
    user_id: int
    cl: int | None = None
    el: int | None = None
    pl: int | None = None
    lop: int | None = None
    nh: int | None = None
    sundays: int | None = None
    other_paid_days: int | None = None
    net_present_days: int | None = None