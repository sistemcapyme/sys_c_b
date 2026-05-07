const { MercadoPagoConfig, Preference } = require('mercadopago');
const { prisma } = require('../config/database');

const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN
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

    const preference = new Preference(client);

    const body = {
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

    const response = await preference.create({ body });
    
    res.json({ success: true, init_point: response.init_point });
  } catch (error) {
    console.error('[crearPreferenciaRecurso]', error);
    res.status(500).json({ success: false, message: 'Error al crear preferencia', error: error.message });
  }
};

module.exports = {
  crearPreferenciaRecurso,
};