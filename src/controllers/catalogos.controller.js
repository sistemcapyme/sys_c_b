import { PrismaClient } from '@prisma/client';
import { MercadoPagoConfig, Payment } from 'mercadopago';

const prisma = new PrismaClient();
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

export const crearPdf = async (req, res) => {
  try {
    const { titulo, descripcion, precio, linkDrive } = req.body;
    const nuevoPdf = await prisma.catalogoPdf.create({
      data: { titulo, descripcion, precio: parseFloat(precio), linkDrive }
    });
    res.status(201).json(nuevoPdf);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const obtenerTodosAdmin = async (req, res) => {
  try {
    const pdfs = await prisma.catalogoPdf.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(pdfs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const obtenerPublicos = async (req, res) => {
  try {
    const pdfs = await prisma.catalogoPdf.findMany({
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        precio: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(pdfs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const actualizarPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, precio, linkDrive } = req.body;
    const pdfActualizado = await prisma.catalogoPdf.update({
      where: { id },
      data: { titulo, descripcion, precio: parseFloat(precio), linkDrive }
    });
    res.status(200).json(pdfActualizado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const eliminarPdf = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.catalogoPdf.delete({ where: { id } });
    res.status(200).json({ message: 'PDF eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const descargarPdf = async (req, res) => {
  try {
    const { pdf_id, payment_id } = req.query;
    
    if (!pdf_id || !payment_id) {
      return res.status(400).json({ error: 'Faltan parámetros de validación' });
    }

    const paymentClient = new Payment(client);
    const paymentInfo = await paymentClient.get({ id: payment_id });

    if (paymentInfo.status !== 'approved' || paymentInfo.external_reference !== pdf_id) {
      return res.status(403).json({ error: 'Pago no válido o no corresponde a este archivo' });
    }

    const pdf = await prisma.catalogoPdf.findUnique({
      where: { id: pdf_id }
    });

    if (!pdf) {
      return res.status(404).json({ error: 'PDF no encontrado' });
    }

    res.status(200).json({ linkDrive: pdf.linkDrive });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};