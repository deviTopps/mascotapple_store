# Generated for live Paystack support.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('store', '0006_order_confirmation_email_sent_at'),
    ]

    operations = [
        migrations.AlterField(
            model_name='order',
            name='payment_method',
            field=models.CharField(choices=[('paystack', 'Paystack online'), ('cod', 'Pay on delivery / pickup')], default='paystack', max_length=12),
        ),
        migrations.AddField(
            model_name='order',
            name='payment_environment',
            field=models.CharField(blank=True, choices=[('test', 'Test'), ('live', 'Live')], max_length=4),
        ),
    ]
