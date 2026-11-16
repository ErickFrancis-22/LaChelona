import { HttpErrorResponse } from '@angular/common/http';
import { isOrderLockedError, validationErrors, validationMessage } from './order-errors';

const httpError = (status: number, error: unknown) => new HttpErrorResponse({ status, error });

describe('order-errors', () => {
  it('should detect the 422 of an order that is no longer PENDING', () => {
    const err = httpError(422, {
      message: 'Solo los pedidos pendientes pueden modificarse.',
      errors: { order: ['Solo los pedidos pendientes pueden modificarse.'] },
    });
    expect(isOrderLockedError(err)).toBe(true);
  });

  it('should not treat stock errors or other statuses as locked', () => {
    expect(isOrderLockedError(httpError(422, { errors: { products: ['Stock insuficiente para Agua.'] } }))).toBe(false);
    expect(isOrderLockedError(httpError(404, { message: 'Pedido no encontrado.' }))).toBe(false);
    expect(isOrderLockedError(httpError(0, null))).toBe(false);
  });

  it('should only read validation errors from a 422', () => {
    expect(validationErrors(httpError(500, { errors: { order: ['x'] } }))).toEqual({});
  });

  it('should join the 422 messages or use the fallback', () => {
    const err = httpError(422, { errors: { products: ['Stock insuficiente para Agua.'], items: ['Falta algo.'] } });
    expect(validationMessage(err, 'Error')).toBe('Stock insuficiente para Agua.\nFalta algo.');
    expect(validationMessage(httpError(422, {}), 'Error')).toBe('Error');
  });
});
