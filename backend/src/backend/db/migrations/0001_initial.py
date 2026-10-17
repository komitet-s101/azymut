from tortoise import migrations
from tortoise.migrations import operations as ops
from backend.db.models import PriceLevel
from tortoise.fields.base import OnDelete
from tortoise import fields
from tortoise.indexes import Index

class Migration(migrations.Migration):
    initial = True

    operations = [
        ops.CreateModel(
            name='Place',
            fields=[
                ('id', fields.IntField(generated=True, primary_key=True, unique=True, db_index=True)),
                ('name', fields.CharField(max_length=255)),
                ('description', fields.TextField(null=True, unique=False)),
                ('city', fields.CharField(max_length=128)),
                ('gmina', fields.CharField(max_length=128)),
                ('address_line', fields.CharField(null=True, max_length=512)),
                ('latitude', fields.FloatField()),
                ('longitude', fields.FloatField()),
                ('category', fields.CharField(max_length=64)),
                ('is_indoor', fields.BooleanField()),
                ('is_outdoor', fields.BooleanField()),
                ('adult_only', fields.BooleanField(default=False)),
                ('min_age_recommended', fields.SmallIntField(null=True)),
                ('typical_visit_minutes', fields.IntField()),
                ('price_level', fields.IntEnumField(description='FREE: 0\nLOW: 1\nMEDIUM: 2\nHIGH: 3', enum_type=PriceLevel, generated=False)),
                ('price_max_pln', fields.DecimalField(null=True, max_digits=10, decimal_places=2)),
                ('gastro_intensity', fields.SmallIntField(default=0)),
                ('game_interactivity', fields.SmallIntField(default=0)),
                ('physical_activity_level', fields.SmallIntField(default=0)),
                ('cultural_education', fields.SmallIntField(default=0)),
                ('nature_relaxation', fields.SmallIntField(default=0)),
                ('family_friendly', fields.SmallIntField(default=0)),
                ('rain_suitable', fields.SmallIntField(default=0)),
                ('created_at', fields.DatetimeField(auto_now=False, auto_now_add=True)),
                ('updated_at', fields.DatetimeField(auto_now=True, auto_now_add=False)),
            ],
            options={'table': 'place', 'app': 'models', 'pk_attr': 'id'},
            bases=['Model'],
        ),
        ops.CreateModel(
            name='OpeningHours',
            fields=[
                ('id', fields.IntField(generated=True, primary_key=True, unique=True, db_index=True)),
                ('place', fields.ForeignKeyField('models.Place', source_field='place_id', db_constraint=True, to_field='id', related_name='opening_hours', on_delete=OnDelete.CASCADE)),
                ('day_of_week', fields.SmallIntField()),
                ('opens_at', fields.CharField(max_length=5)),
                ('closes_at', fields.CharField(max_length=5)),
            ],
            options={'table': 'opening_hours', 'app': 'models', 'indexes': [Index(fields=['place_id', 'day_of_week'])], 'pk_attr': 'id'},
            bases=['Model'],
        ),
        ops.CreateModel(
            name='PredefinedRoute',
            fields=[
                ('id', fields.IntField(generated=True, primary_key=True, unique=True, db_index=True)),
                ('name', fields.CharField(max_length=255)),
                ('description', fields.TextField(null=True, unique=False)),
                ('duration_minutes_approx', fields.IntField()),
                ('stops_min', fields.IntField()),
                ('stops_max', fields.IntField()),
                ('city', fields.CharField(max_length=128)),
                ('gmina', fields.CharField(max_length=128)),
                ('price_level_max', fields.IntEnumField(null=True, description='FREE: 0\nLOW: 1\nMEDIUM: 2\nHIGH: 3', enum_type=PriceLevel, generated=False)),
            ],
            options={'table': 'predefined_route', 'app': 'models', 'pk_attr': 'id'},
            bases=['Model'],
        ),
        ops.CreateModel(
            name='RouteStop',
            fields=[
                ('id', fields.IntField(generated=True, primary_key=True, unique=True, db_index=True)),
                ('route', fields.ForeignKeyField('models.PredefinedRoute', source_field='route_id', db_constraint=True, to_field='id', related_name='stops', on_delete=OnDelete.CASCADE)),
                ('place', fields.ForeignKeyField('models.Place', source_field='place_id', db_constraint=True, to_field='id', related_name='route_stops', on_delete=OnDelete.CASCADE)),
                ('sequence', fields.IntField()),
                ('dwell_minutes', fields.IntField(null=True)),
            ],
            options={'table': 'route_stop', 'app': 'models', 'unique_together': (('route_id', 'sequence'),), 'pk_attr': 'id'},
            bases=['Model'],
        ),
    ]
