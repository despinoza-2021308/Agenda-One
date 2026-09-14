const { describe, it } = require('node:test');
const assert = require('node:assert');
const {
  calcularHorasDecimales,
  validarHorarios,
  validarFecha,
  validarTelefono,
  validarEmail
} = require('../src/utils/timeUtils');

describe('Cálculo de Horas Decimales (AD-RE-11)', () => {
  it('debe calcular correctamente horas exactas (08:00 a 12:00 = 4.00h)', () => {
    const horas = calcularHorasDecimales('08:00', '12:00');
    assert.strictEqual(horas, 4.00);
  });

  it('debe calcular correctamente fracciones de media hora (08:30 a 11:00 = 2.50h)', () => {
    const horas = calcularHorasDecimales('08:30', '11:00');
    assert.strictEqual(horas, 2.50);
  });

  it('debe calcular correctamente cuartos de hora (09:15 a 10:45 = 1.50h)', () => {
    const horas = calcularHorasDecimales('09:15', '10:45');
    assert.strictEqual(horas, 1.50);
  });

  it('debe redondear adecuadamente a 2 decimales (08:00 a 08:50 = 0.83h)', () => {
    const horas = calcularHorasDecimales('08:00', '08:50');
    assert.strictEqual(horas, 0.83);
  });

  it('debe retornar 0 si la hora fin es menor o igual a la hora inicio', () => {
    assert.strictEqual(calcularHorasDecimales('14:00', '12:00'), 0);
    assert.strictEqual(calcularHorasDecimales('10:00', '10:00'), 0);
  });

  it('debe retornar 0 con valores nulos o inválidos', () => {
    assert.strictEqual(calcularHorasDecimales(null, '12:00'), 0);
    assert.strictEqual(calcularHorasDecimales('08:00', undefined), 0);
    assert.strictEqual(calcularHorasDecimales('invalido', '12:00'), 0);
  });
});

describe('Validación de Horarios y Duración de Sesión', () => {
  it('debe aprobar una sesión válida de 3.5 horas', () => {
    const res = validarHorarios('08:30', '12:00');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.horas, 3.50);
  });

  it('debe rechazar sesiones de menos de 15 minutos (0.25h)', () => {
    const res = validarHorarios('08:00', '08:10');
    assert.strictEqual(res.valid, false);
    assert.match(res.error, /al menos 15 minutos/);
  });

  it('debe rechazar sesiones de más de 16 horas en un solo día', () => {
    const res = validarHorarios('06:00', '23:00');
    assert.strictEqual(res.valid, false);
    assert.match(res.error, /no puede exceder las 16 horas/);
  });

  it('debe rechazar formato de hora inválido', () => {
    const res = validarHorarios('25:00', '12:00');
    assert.strictEqual(res.valid, false);
    assert.match(res.error, /Formato de hora inválido/);
  });
});

describe('Validación de Fechas de Calendario', () => {
  it('debe validar correctamente una fecha real en día laboral', () => {
    // 2026-09-09 es Miércoles
    const res = validarFecha('2026-09-09');
    assert.strictEqual(res.valid, true);
    assert.strictEqual(res.isWeekend, false);
  });

  it('debe detectar correctamente fines de semana (Sábado/Domingo)', () => {
    // 2026-09-06 es Domingo, 2026-09-05 es Sábado
    const resDom = validarFecha('2026-09-06');
    assert.strictEqual(resDom.valid, true);
    assert.strictEqual(resDom.isWeekend, true);
  });

  it('debe rechazar fechas imposibles en el calendario (ej: 30 de febrero)', () => {
    const res = validarFecha('2026-02-30');
    assert.strictEqual(res.valid, false);
    assert.match(res.error, /no existe en el calendario/);
  });

  it('debe rechazar fechas con formato incorrecto', () => {
    const res = validarFecha('09/09/2026');
    assert.strictEqual(res.valid, false);
    assert.match(res.error, /AAAA-MM-DD/);
  });
});

describe('Validación de Teléfonos y Correos', () => {
  it('debe validar teléfonos con código de país y formato estándar', () => {
    assert.strictEqual(validarTelefono('+502 5555-1001'), true);
    assert.strictEqual(validarTelefono('55551001'), true);
    assert.strictEqual(validarTelefono('123'), false); // Muy corto
  });

  it('debe validar correos válidos e ignorar opcionales vacíos', () => {
    assert.strictEqual(validarEmail('test@capacitacion.gt'), true);
    assert.strictEqual(validarEmail(''), true);
    assert.strictEqual(validarEmail('invalido-sin-arroba'), false);
  });
});
