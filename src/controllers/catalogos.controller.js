const { PrismaClient } = require('@prisma/client');
const { MercadoPagoConfig, Payment } = require('mercadopago');
const cloudinary = require('cloudinary').v2;

const prisma = new PrismaClient();
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

const uploadToCloudinary = async (fileBuffer, mimetype) => {
  const b64 = Buffer.from(fileBuffer).toString('base64');
  const dataURI = `data:${mimetype};base64,${b64}`;
  const result = await cloudinary.uploader.upload(dataURI, { folder: 'catalogos' });
  return result.secure_url;
};

const extractPublicId = (url) => {
  try {
    const parts = url.split('/');
    const fileWithExt = parts.pop();
    const folder = parts.pop();
    const filename = fileWithExt.split('.')[0];
    return `${folder}/${filename}`;
  } catch (error) {
    console.error(error);
    return null;
  }
};

const crearPdf = async (req, res) => {
  try {
    const { titulo, descripcion, precio, linkDrive, activo } = req.body;
    let imagenUrl = null;

    if (req.file) {
      imagenUrl = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
    }

    const nuevoPdf = await prisma.catalogoPdf.create({
      data: { 
        titulo, 
        descripcion, 
        precio: parseFloat(precio), 
        linkDrive, 
        activo: activo === 'true' || activo === true,
        imagenUrl
      }
    });
    res.status(201).json(nuevoPdf);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const obtenerTodosAdmin = async (req, res) => {
  try {
    const pdfs = await prisma.catalogoPdf.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json(pdfs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const obtenerPublicos = async (req, res) => {
  try {
    const pdfs = await prisma.catalogoPdf.findMany({
      where: { activo: true },
      select: {
        id: true,
        titulo: true,
        descripcion: true,
        precio: true,
        imagenUrl: true,
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

const actualizarPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, precio, linkDrive, activo } = req.body;
    
    const pdfExistente = await prisma.catalogoPdf.findUnique({ where: { id } });
    if (!pdfExistente) return res.status(404).json({ error: 'PDF no encontrado' });

    const dataToUpdate = { 
      titulo, 
      descripcion, 
      precio: parseFloat(precio), 
      linkDrive, 
      activo: activo === 'true' || activo === true 
    };

    if (req.file) {
      if (pdfExistente.imagenUrl) {
        const publicId = extractPublicId(pdfExistente.imagenUrl);
        if (publicId) {
          await cloudinary.uploader.destroy(publicId);
        }
      }
      dataToUpdate.imagenUrl = await uploadToCloudinary(req.file.buffer, req.file.mimetype);
    }

    const pdfActualizado = await prisma.catalogoPdf.update({
      where: { id },
      data: dataToUpdate
    });
    res.status(200).json(pdfActualizado);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const eliminarPdf = async (req, res) => {
  try {
    const { id } = req.params;

    const pdfExistente = await prisma.catalogoPdf.findUnique({ where: { id } });
    
    if (pdfExistente && pdfExistente.imagenUrl) {
      const publicId = extractPublicId(pdfExistente.imagenUrl);
      if (publicId) {
        await cloudinary.uploader.destroy(publicId);
      }
    }

    await prisma.catalogoPdf.delete({ 
      where: { id }
    });
    
    res.status(200).json({ message: 'PDF eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const descargarPdf = async (req, res) => {
  try {
    const { pdf_id, payment_id } = req.query;
    
    if (!pdf_id || !payment_id) {
      return res.status(400).json({ error: 'Faltan parámetros' });
    }

    const paymentClient = new Payment(client);
    const paymentInfo = await paymentClient.get({ id: payment_id });

    if (paymentInfo.status !== 'approved' || paymentInfo.external_reference !== pdf_id) {
      return res.status(403).json({ error: 'Pago no válido' });
    }

    const pdf = await prisma.catalogoPdf.findUnique({
      where: { id: pdf_id }
    });

    if (!pdf) {
      return res.status(404).json({ error: 'PDF no encontrado' });
    }

    res.status(200).json({ 
      linkDrive: pdf.linkDrive,
      titulo: pdf.titulo
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  crearPdf,
  obtenerTodosAdmin,
  obtenerPublicos,
  actualizarPdf,
  eliminarPdf,
  descargarPdf
};