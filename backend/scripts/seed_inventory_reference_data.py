"""Preview or insert the supplied Inventory UOM and stock-group reference rows."""

import argparse
import os
from decimal import Decimal
from pathlib import Path

from dotenv import load_dotenv
from sqlalchemy.engine import make_url

BACKEND_DIR = Path(__file__).resolve().parents[1]
load_dotenv(BACKEND_DIR / ".env")

from app.core.database import SessionLocal
from app.modules.inventory.models import InventoryStockGroup, InventoryUnitOfMeasure


UNIT_OF_MEASURES = (
    ("Bag", "Bags", 0),
    ("Bale", "Bales", 0),
    ("Btl", "Bottles", 0),
    ("Box", "Boxes", 0),
    ("Bkl", "Buckles", 0),
    ("Bunch", "Bunches", 0),
    ("Bndl", "Bundles", 0),
    ("Can", "Cans", 0),
    ("Ctn", "Cartons", 0),
    ("cl", "Centilitre", 3),
    ("cm", "Centimetre", 3),
    ("m3", "Cubic metre", 3),
    ("Dzn", "Dozens", 0),
    ("Drum", "Drums", 0),
    ("Ea", "Each", 0),
    ("grm", "Gram (g)", 3),
    ("kg", "Kilogram (kg)", 3),
    ("kl", "Kilolitre (kl)", 3),
    ("km", "Kilometre (km)", 3),
    ("ltr", "Litre", 3),
    ("mtr", "Metre", 3),
    ("mt", "Metric Ton (mt)", 3),
    ("mg", "Milligram (mg)", 3),
    ("ml", "Millilitre", 3),
    ("mm", "Millimetre", 3),
    ("Num", "Numbers", 0),
    ("Pack", "Packs", 0),
    ("Pair", "Pairs", 0),
    ("Pcs", "Pieces", 0),
    ("Qtl", "Quintals", 3),
    ("Roll", "Rolls", 0),
    ("Set", "Sets", 0),
    ("Sq mtr", "Square metre", 3),
    ("Sq Yrd", "Square Yards", 3),
)

STOCK_GROUPS = (
    "Primary stock group",
    "Raw Material",
    "Finished Product",
    "Consumables",
    "packing material",
    "Trading Items",
    "Tools & Spares",
)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Insert missing rows. Without this flag, only preview the changes.",
    )
    args = parser.parse_args()

    database_url = os.environ.get("DATABASE_URL")
    if not database_url:
        raise RuntimeError("DATABASE_URL is not set.")

    target = make_url(database_url)
    print(
        "Database target: "
        f"{target.drivername}://{target.host}:{target.port}/{target.database}"
    )
    print(f"UOM rows supplied: {len(UNIT_OF_MEASURES)}")
    print(f"Stock-group rows supplied: {len(STOCK_GROUPS)}")
    print("New stock groups will have no parent; existing parents are preserved.")

    with SessionLocal() as session:
        existing_symbols = set(
            session.query(InventoryUnitOfMeasure.symbol).all()
        )
        existing_group_names = set(
            session.query(InventoryStockGroup.name).all()
        )
        existing_symbols = {symbol for (symbol,) in existing_symbols}
        existing_group_names = {name for (name,) in existing_group_names}

        missing_units = [
            row for row in UNIT_OF_MEASURES if row[0] not in existing_symbols
        ]
        missing_groups = [
            name for name in STOCK_GROUPS if name not in existing_group_names
        ]
        print(f"UOM rows to insert: {len(missing_units)}")
        print(f"Stock-group rows to insert: {len(missing_groups)}")

        if not args.apply:
            print("Preview only; no database records were changed.")
            return

        session.add_all(
            InventoryUnitOfMeasure(
                symbol=symbol,
                name=name,
                number_of_decimals=Decimal(f"{decimals}.0"),
            )
            for symbol, name, decimals in missing_units
        )
        session.add_all(
            InventoryStockGroup(name=name, under_stock_group_id=None)
            for name in missing_groups
        )
        session.commit()
        print("Inserted missing reference rows; existing rows were preserved.")


if __name__ == "__main__":
    main()
