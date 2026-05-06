const mercadopago = require('mercadopago');
const { prisma } = require('../config/database');

mercadopago.configure({
  access_token: process.env.MERCADOPAGO_ACCESS_TOKEN,
});

const crearPreferenciaRecurso = async (req, res) => {
  try {
    const { recursoId, referencia, returnUrl } = req.body;
    
    const recurso = await prisma.enlaceRecurso.findUnique({
      where: { id: parseInt(recursoId) },
    });

    if (!recurso) {
      return res.status(404).json({ success: false, message: 'Recurso no encontrado' });
    }

    const preference = {
      items: [
        {
          title: recurso.titulo,
          unit_price: parseFloat(recurso.costo),
          quantity: 1,
          currency_id: 'MXN',
        },
      ],
      back_urls: {
        success: `${process.env.FRONTEND_URL}/pago-exitoso-recurso`,
        failure: `${process.env.FRONTEND_URL}/pago-fallido-recurso`,
        pending: `${process.env.FRONTEND_URL}/pago-fallido-recurso`,
      },
      auto_return: 'approved',
      external_reference: referencia,
      metadata: {
        recurso_id: recurso.id,
        return_url: returnUrl,
      },
    };

    const response = await mercadopago.preferences.create(preference);
    res.json({ success: true, init_point: response.body.init_point });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al crear preferencia', error: error.message });
  }
};

module.exports = {
  crearPreferenciaRecurso,
};