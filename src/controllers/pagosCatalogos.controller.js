const { MercadoPagoConfig, Preference } = require('mercadopago');

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

const crearPreferenciaCatalogo = async (req, res) => {
  try {
    const { idArticulo, titulo, precio } = req.body;
    const urlFrontend = process.env.FRONTEND_URL || req.headers.origin;

    const preference = new Preference(client);
    const response = await preference.create({
      body: {
        items: [
          {
            id: idArticulo,
            title: titulo,
            quantity: 1,
            unit_price: Number(precio),
            currency_id: 'MXN',
          }
        ],
        back_urls: {
          success: `${urlFrontend}/catalogo/pago-exitoso`,
          failure: `${urlFrontend}/catalogo/pago-fallido`,
          pending: `${urlFrontend}/catalogo/pago-fallido`
        },
        auto_return: 'approved',
        external_reference: idArticulo,
      }
    });

    res.status(200).json({ id: response.id, init_point: response.init_point });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  crearPreferenciaCatalogo
};