from tortoise import migrations
from tortoise.migrations import operations as ops
from backend.db.models import PriceLevel
from tortoise.fields.base import OnDelete
from tortoise import fields

class Migration(migrations.Migration):
    dependencies = [('models', '0001_initial')]

    initial = False

    operations = [
        ops.CreateModel(
            name='CatalogSource',
            fields=[
                ('id', fields.IntField(generated=True, primary_key=True, unique=True, db_index=True)),
                ('url', fields.CharField(unique=True, max_length=2048)),
                ('accessed_at', fields.DatetimeField(null=True, auto_now=False, auto_now_add=False)),
                ('status', fields.CharField(null=True, max_length=32)),
                ('what_it_confirms', fields.TextField(null=True, unique=False)),
            ],
            options={'table': 'catalog_source', 'app': 'models', 'pk_attr': 'id'},
            bases=['Model'],
        ),
        ops.CreateModel(
            name='Event',
            fields=[
                ('id', fields.IntField(generated=True, primary_key=True, unique=True, db_index=True)),
                ('external_id', fields.CharField(unique=True, max_length=16)),
                ('name', fields.CharField(max_length=255)),
                ('description', fields.TextField(null=True, unique=False)),
                ('place', fields.ForeignKeyField('models.Place', source_field='place_id', null=True, db_constraint=True, to_field='id', related_name='events', on_delete=OnDelete.SET_NULL)),
                ('venue_name', fields.CharField(null=True, max_length=255)),
                ('address_line', fields.CharField(null=True, max_length=512)),
                ('city', fields.CharField(null=True, max_length=128)),
                ('gmina', fields.CharField(null=True, max_length=128)),
                ('latitude', fields.FloatField(null=True)),
                ('longitude', fields.FloatField(null=True)),
                ('start_date', fields.DateField()),
                ('start_time', fields.CharField(null=True, max_length=5)),
                ('end_time', fields.CharField(null=True, max_length=5)),
                ('category', fields.CharField(null=True, max_length=64)),
                ('sport', fields.CharField(null=True, max_length=64)),
                ('competition', fields.CharField(null=True, max_length=128)),
                ('age_group', fields.CharField(null=True, max_length=32)),
                ('gender', fields.CharField(null=True, max_length=16)),
                ('home_team', fields.CharField(null=True, max_length=128)),
                ('away_team', fields.CharField(null=True, max_length=128)),
                ('price_level', fields.IntEnumField(null=True, description='FREE: 0\nLOW: 1\nMEDIUM: 2\nHIGH: 3', enum_type=PriceLevel, generated=False)),
                ('price_max_pln', fields.DecimalField(null=True, max_digits=10, decimal_places=2)),
                ('is_free', fields.BooleanField(default=False)),
                ('participation_mode', fields.CharField(null=True, max_length=32)),
                ('status', fields.CharField(null=True, max_length=32)),
                ('official_url', fields.CharField(null=True, max_length=512)),
                ('booking_url', fields.CharField(null=True, max_length=512)),
                ('source_url', fields.CharField(null=True, max_length=512)),
            ],
            options={'table': 'event', 'app': 'models', 'pk_attr': 'id'},
            bases=['Model'],
        ),
        ops.CreateModel(
            name='NeedsVerificationItem',
            fields=[
                ('id', fields.IntField(generated=True, primary_key=True, unique=True, db_index=True)),
                ('record_external_id', fields.CharField(max_length=16)),
                ('source_file', fields.CharField(max_length=64)),
                ('issue', fields.TextField(unique=False)),
                ('fields', fields.TextField(null=True, unique=False)),
            ],
            options={'table': 'needs_verification', 'app': 'models', 'pk_attr': 'id'},
            bases=['Model'],
        ),
        ops.AddField(
            model_name='OpeningHours',
            name='season_note',
            field=fields.TextField(null=True, unique=False),
        ),
        ops.AddField(
            model_name='OpeningHours',
            name='source_url',
            field=fields.CharField(null=True, max_length=512),
        ),
        ops.AlterField(
            model_name='Place',
            name='latitude',
            field=fields.FloatField(null=True),
        ),
        ops.AlterField(
            model_name='Place',
            name='longitude',
            field=fields.FloatField(null=True),
        ),
        ops.AddField(
            model_name='Place',
            name='booking_url',
            field=fields.CharField(null=True, max_length=512),
        ),
        ops.AddField(
            model_name='Place',
            name='coords_source',
            field=fields.CharField(null=True, max_length=64),
        ),
        ops.AddField(
            model_name='Place',
            name='external_id',
            field=fields.CharField(null=True, unique=True, max_length=16),
        ),
        ops.AddField(
            model_name='Place',
            name='missing_fields',
            field=fields.TextField(null=True, unique=False),
        ),
        ops.AddField(
            model_name='Place',
            name='official_url',
            field=fields.CharField(null=True, max_length=512),
        ),
        ops.AddField(
            model_name='Place',
            name='participation_mode',
            field=fields.CharField(null=True, max_length=32),
        ),
        ops.AddField(
            model_name='Place',
            name='price_notes',
            field=fields.TextField(null=True, unique=False),
        ),
        ops.AddField(
            model_name='Place',
            name='public_access',
            field=fields.CharField(null=True, max_length=16),
        ),
        ops.AddField(
            model_name='Place',
            name='secondary_categories',
            field=fields.TextField(null=True, unique=False),
        ),
        ops.AddField(
            model_name='Place',
            name='source_urls',
            field=fields.TextField(null=True, unique=False),
        ),
        ops.AddField(
            model_name='Place',
            name='tags',
            field=fields.TextField(null=True, unique=False),
        ),
        ops.AddField(
            model_name='Place',
            name='typical_visit_estimated',
            field=fields.BooleanField(default=False, null=True),
        ),
        ops.AddField(
            model_name='Place',
            name='verification_status',
            field=fields.CharField(null=True, max_length=32),
        ),
        ops.AddField(
            model_name='PredefinedRoute',
            name='category',
            field=fields.CharField(null=True, max_length=64),
        ),
        ops.AddField(
            model_name='PredefinedRoute',
            name='external_id',
            field=fields.CharField(null=True, unique=True, max_length=16),
        ),
        ops.AddField(
            model_name='PredefinedRoute',
            name='route_type',
            field=fields.CharField(null=True, max_length=32),
        ),
        ops.AddField(
            model_name='PredefinedRoute',
            name='source_url',
            field=fields.CharField(null=True, max_length=512),
        ),
    ]
