from tortoise import fields, migrations
from tortoise.migrations import operations as ops

from backend.db.models import PriceLevel


class Migration(migrations.Migration):
    dependencies = [("models", "0002_auto_20261017_1438")]

    operations = [
        ops.AlterField(
            model_name="Place",
            name="price_level",
            field=fields.IntEnumField(
                null=True,
                description="FREE: 0\nLOW: 1\nMEDIUM: 2\nHIGH: 3",
                enum_type=PriceLevel,
                generated=False,
            ),
        ),
    ]
