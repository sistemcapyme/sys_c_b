const { MercadoPagoConfig, Preference, Payment } = require('mercadopago');
const { prisma } = require('../config/database');

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

const crearPreferencia = async (req, res) => {
  try {
    // 1. Extraemos exactamente lo que manda el frontend
    const { titulo, precio, cantidad, idReferencia, tipo } = req.body;

    const preference = new Preference(client);

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
          success: 'https://capyme.com.mx/pago-exitoso',
          failure: 'https://capyme.com.mx/pago-fallido',
          pending: 'https://capyme.com.mx/pago-pendiente'
        },
        auto_return: 'approved',
        // 2. FUNDAMENTAL PARA EL WEBHOOK
        external_reference: idReferencia,
        metadata: {
          tipo: tipo
        },
        // 3. URL A LA QUE MERCADO PAGO AVISARÁ (Asegúrate de que la ruta /api/pagos sea la correcta en tu index.js)
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

const webhook = async (req, res) => {
  try {
    const { type, data } = req.body;

    if (type === 'payment' && data?.id) {
      const paymentId     = data.id;
      const paymentClient = new Payment(client);
      const paymentInfo   = await paymentClient.get({ id: paymentId });

      const status      = paymentInfo.status;
      const externalRef = paymentInfo.external_reference;
      const metadata    = paymentInfo.metadata || {};
      const tipo        = metadata.tipo || '';

      if (status === 'approved' && externalRef) {
        const refStr = String(externalRef);

        const esCurso    = tipo === 'curso'    || refStr.startsWith('REF');
        const esRecurso  = tipo === 'recurso'  || refStr.startsWith('RESR') || refStr.startsWith('REC');
        const esInversion= tipo === 'campana'  || refStr.startsWith('INV');

        if (esCurso) {
          const pago = await prisma.pagoInscripcion.findUnique({
            where: { referencia: refStr },
            include: {
              inscripcion: {
                include: {
                  usuario: { select: { id: true } },
                  curso:   { select: { titulo: true } },
                },
              },
            },
          });

          if (pago && pago.estadoPago !== 'confirmado') {
            await prisma.pagoInscripcion.update({
              where: { id: pago.id },
              data: {
                estadoPago:        'confirmado',
                mercadoPagoId:     String(paymentId),
                fechaConfirmacion: new Date(),
              },
            });

            await prisma.notificacion.create({
              data: {
                usuarioId: pago.inscripcion.usuario.id,
                tipo:      'pago_confirmado',
                titulo:    'Pago confirmado',
                mensaje:   `Tu pago para el curso "${pago.inscripcion.curso.titulo}" fue confirmado. ¡Bienvenido!`,
                leida:     false,
              },
            });
          }
        }

        if (esRecurso) {
          const pago = await prisma.pagoAccesoRecurso.findUnique({
            where: { referencia: refStr },
            include: {
              acceso: {
                include: {
                  usuario: { select: { id: true } },
                  enlace:  { select: { titulo: true } },
                },
              },
            },
          });

          if (pago && pago.estadoPago !== 'confirmado') {
            await prisma.$transaction([
              prisma.pagoAccesoRecurso.update({
                where: { id: pago.id },
                data: {
                  estadoPago:        'confirmado',
                  mercadoPagoId:     String(paymentId),
                  fechaConfirmacion: new Date(),
                },
              }),
              prisma.accesoRecurso.update({
                where: { id: pago.accesoId },
                data: { estado: 'activo' },
              }),
            ]);

            await prisma.notificacion.create({
              data: {
                usuarioId: pago.acceso.usuario.id,
                tipo:      'acceso_confirmado',
                titulo:    'Acceso confirmado',
                mensaje:   `Tu acceso al recurso "${pago.acceso.enlace.titulo}" fue confirmado.`,
                leida:     false,
              },
            });
          }
        }

        if (esInversion) {
          const inversion = await prisma.inversion.findUnique({
            where: { referencia: refStr },
            include: {
              campana:  { select: { id: true, titulo: true, metaRecaudacion: true, montoRecaudado: true, tipoCrowdfunding: true } },
              inversor: { select: { id: true } },
            },
          });

          if (inversion && inversion.estadoPago !== 'confirmado') {
            await prisma.$transaction(async (tx) => {
              await tx.inversion.update({
                where: { id: inversion.id },
                data: {
                  estadoPago:        'confirmado',
                  mercadoPagoId:     String(paymentId),
                  fechaConfirmacion: new Date(),
                },
              });

              await tx.campana.update({
                where: { id: inversion.campanaId },
                data:  { montoRecaudado: { increment: parseFloat(inversion.monto) } },
              });

              const metaNum    = parseFloat(inversion.campana.metaRecaudacion);
              const nuevoTotal = parseFloat(inversion.campana.montoRecaudado || 0) + parseFloat(inversion.monto);
              if (nuevoTotal >= metaNum) {
                await tx.campana.update({ where: { id: inversion.campanaId }, data: { estado: 'completada' } });
              }
            });

            const esInversionReal = inversion.campana.tipoCrowdfunding === 'inversion';
            let mensajeNotif = esInversionReal 
              ? `Tu inversión de $${parseFloat(inversion.monto).toLocaleString('es-MX')} MXN en "${inversion.campana.titulo}" fue confirmada. Comuníquese con el gerente de CAPYME y el dueño de la campaña. Es su responsabilidad avisar a ambos.`
              : `Tu donativo de $${parseFloat(inversion.monto).toLocaleString('es-MX')} MXN en "${inversion.campana.titulo}" fue confirmado.`;

            await prisma.notificacion.create({
              data: {
                usuarioId: inversion.inversor.id,
                tipo:      'inversion_confirmada',
                titulo:    'Aportación confirmada',
                mensaje:   mensajeNotif,
                leida:     false,
              },
            });
          }
        }
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error("Error en webhook:", error);
    res.status(200).send('OK'); // MP requiere un 200 aunque falle algo internamente
  }
};

module.exports = { crearPreferencia, webhook };