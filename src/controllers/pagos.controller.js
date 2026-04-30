const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const { prisma } = require('../config/database');

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const crearPreferencia = async (req, res) => {
  try {
    const { titulo, precio, cantidad, idReferencia, tipo, returnUrl } = req.body;

    const preference = new Preference(client);

    const safeReturnUrl = returnUrl ? encodeURIComponent(returnUrl) : encodeURIComponent('/');

    const response = await preference.create({
      body: {
        items: [
          {
            title: titulo,
            unit_price: Number(precio),
            quantity: Number(cantidad),
            currency_id: 'MXN'
          }
        ],
        back_urls: {
          success: `https://capyme.com.mx/pago-exitoso?return_url=${safeReturnUrl}`,
          failure: `https://capyme.com.mx/pago-fallido?return_url=${safeReturnUrl}`,
          pending: `https://capyme.com.mx/pago-pendiente?return_url=${safeReturnUrl}`
        },
        auto_return: 'approved',
        external_reference: idReferencia,
        metadata: {
          tipo: tipo
        },
        notification_url: 'https://sys-c-b.onrender.com/api/pagos/webhook'
      }
    });

    res.status(200).json({ 
      success: true,
      id: response.id, 
      init_point: response.init_point 
    });

  } catch (error) {
    console.error("Error al crear preferencia:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};