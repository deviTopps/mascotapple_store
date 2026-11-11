from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0005_product_color_image_positions'),
    ]

    operations = [
        migrations.AddField(
            model_name='order',
            name='confirmation_email_sent_at',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
