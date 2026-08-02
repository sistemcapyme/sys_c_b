const { prisma } = require('../config/database');

const ESTADOS_KANBAN_VALIDOS = ['ENCARGADO', 'EN_PROCESO', 'POSTULADO'];

const obtenerAprendicesKanban = async (req, res, next) => {
  try {
    const usuario = req.usuario || req.user || {};
    const { encargadoId } = req.query;

    const where = { activo: true };
    if (usuario.rol === 'encargado_jcf') {
      where.encargadoId = usuario.id;
    } else if (encargadoId) {
      where.encargadoId = Number(encargadoId);
    }

    const aprendices = await prisma.jovenJcf.findMany({
      where,
      include: {
        encargado: { select: { nombre: true, apellido: true } }
      },
      orderBy: { ordenKanban: 'asc' }
    });

    res.status(200).json({ success: true, data: aprendices });
  } catch (error) {
    next(error);
  }
};

const obtenerAprendizPorId = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' });
    const aprendiz = await prisma.jovenJcf.findUnique({
      where: { id },
      include: {
        encargado: { select: { nombre: true, apellido: true } },
        negocio: true
      }
    });
    if (!aprendiz) return res.status(404).json({ success: false, message: 'Aprendiz no encontrado' });
    res.status(200).json({ success: true, data: aprendiz });
  } catch (error) {
    next(error);
  }
};

const crearAprendizKanban = async (req, res, next) => {
  try {
    const usuarioActual = req.usuario || req.user || {};
    const {
      nombre,
      apellido,
      nombreCompleto,
      usuarioPrograma,
      passwordPrograma,
      credencialesJcf,
      linkDocumentos,
      linkPapeles,
      linkNegocio,
      nombreNegocio,
      linkImagenNegocio,
      encargadoId
    } = req.body;

    let nombreFinal = nombre || nombreCompleto;
    let apellidoFinal = apellido || '';

    if (!nombreFinal && nombreCompleto) {
      const partes = nombreCompleto.split(' ');
      nombreFinal = partes[0] || '';
      apellidoFinal = partes.slice(1).join(' ') || '';
    }

    if (!nombreFinal) {
      return res.status(400).json({ success: false, message: 'El nombre es requerido' });
    }

    const nuevoAprendiz = await prisma.jovenJcf.create({
      data: {
        nombre: nombreFinal,
        apellido: apellidoFinal,
        usuarioPrograma: usuarioPrograma || null,
        passwordPrograma: passwordPrograma || credencialesJcf || null,
        linkDocumentos: linkDocumentos || linkPapeles || null,
        linkNegocio: linkNegocio || nombreNegocio || null,
        linkImagenNegocio: linkImagenNegocio || null,
        encargadoId: encargadoId ? Number(encargadoId) : (usuarioActual.rol === 'encargado_jcf' ? usuarioActual.id : null),
        usuarioId: usuarioActual.id || null,
        estadoKanban: 'ENCARGADO',
        ordenKanban: 0,
        activo: true
      },
      include: {
        encargado: { select: { nombre: true, apellido: true } }
      }
    });

    res.status(201).json({ success: true, data: nuevoAprendiz });
  } catch (error) {
    next(error);
  }
};

const actualizarAprendizKanban = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' });

    const existente = await prisma.jovenJcf.findUnique({ where: { id } });
    if (!existente) return res.status(404).json({ success: false, message: 'Aprendiz no encontrado' });

    const {
      nombre,
      apellido,
      nombreCompleto,
      usuarioPrograma,
      passwordPrograma,
      credencialesJcf,
      linkDocumentos,
      linkPapeles,
      linkNegocio,
      nombreNegocio,
      linkImagenNegocio,
      encargadoId
    } = req.body;

    let nombreFinal = nombre || nombreCompleto;
    let apellidoFinal = apellido;

    if (!nombreFinal && nombreCompleto) {
      const partes = nombreCompleto.split(' ');
      nombreFinal = partes[0] || '';
      apellidoFinal = partes.slice(1).join(' ') || '';
    }

    const dataUpdate = {};
    if (nombreFinal) dataUpdate.nombre = nombreFinal;
    if (apellidoFinal !== undefined) dataUpdate.apellido = apellidoFinal;
    if (usuarioPrograma !== undefined) dataUpdate.usuarioPrograma = usuarioPrograma;
    if (passwordPrograma !== undefined) dataUpdate.passwordPrograma = passwordPrograma;
    if (credencialesJcf !== undefined) dataUpdate.passwordPrograma = credencialesJcf;
    if (linkDocumentos !== undefined) dataUpdate.linkDocumentos = linkDocumentos;
    if (linkPapeles !== undefined) dataUpdate.linkDocumentos = linkPapeles;
    if (linkNegocio !== undefined) dataUpdate.linkNegocio = linkNegocio;
    if (nombreNegocio !== undefined) dataUpdate.linkNegocio = nombreNegocio;
    if (linkImagenNegocio !== undefined) dataUpdate.linkImagenNegocio = linkImagenNegocio;
    if (encargadoId !== undefined) dataUpdate.encargadoId = encargadoId ? Number(encargadoId) : null;

    const aprendizActualizado = await prisma.jovenJcf.update({
      where: { id },
      data: dataUpdate,
      include: {
        encargado: { select: { nombre: true, apellido: true } }
      }
    });

    res.status(200).json({ success: true, data: aprendizActualizado });
  } catch (error) {
    next(error);
  }
};

const actualizarEstadoKanban = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' });

    const { estadoKanban, ordenKanban } = req.body;

    if (estadoKanban && !ESTADOS_KANBAN_VALIDOS.includes(estadoKanban)) {
      return res.status(400).json({ success: false, message: 'Estado de kanban inválido' });
    }

    const data = {};
    if (estadoKanban !== undefined) data.estadoKanban = estadoKanban;
    if (ordenKanban !== undefined) data.ordenKanban = Number(ordenKanban);

    const actualizado = await prisma.jovenJcf.update({
      where: { id },
      data
    });

    res.status(200).json({ success: true, data: actualizado });
  } catch (error) {
    next(error);
  }
};

const toggleActivoAprendiz = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' });
    const existente = await prisma.jovenJcf.findUnique({ where: { id } });
    if (!existente) return res.status(404).json({ success: false, message: 'Aprendiz no encontrado' });
    const actualizado = await prisma.jovenJcf.update({
      where: { id },
      data: { activo: !existente.activo }
    });
    res.status(200).json({ success: true, data: actualizado });
  } catch (error) {
    next(error);
  }
};

const actualizarRecurso = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' });
    const { urlRecurso } = req.body;
    const existente = await prisma.jovenJcf.findUnique({ where: { id } });
    if (!existente) return res.status(404).json({ success: false, message: 'Aprendiz no encontrado' });
    const actualizado = await prisma.jovenJcf.update({
      where: { id },
      data: { urlRecurso: urlRecurso || null }
    });
    res.status(200).json({ success: true, data: actualizado });
  } catch (error) {
    next(error);
  }
};

const eliminarAprendiz = async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID inválido' });
    await prisma.jovenJcf.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    next(error);
  }
};

module.exports = {
  obtenerAprendicesKanban,
  obtenerAprendizPorId,
  crearAprendizKanban,
  actualizarAprendizKanban,
  actualizarEstadoKanban,
  toggleActivoAprendiz,
  actualizarRecurso,
  eliminarAprendiz
};