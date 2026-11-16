import { initials } from './initials';

describe('initials', () => {
  it('should use the first and last words, skipping connectors', () => {
    expect(initials('Minisúper El Roble')).toBe('MR');
    expect(initials('Tienda La Esperanza')).toBe('TE');
    expect(initials('Abarrotes de la Colonia')).toBe('AC');
  });

  it('should use the first two letters of a single word', () => {
    expect(initials('Chelona')).toBe('CH');
    expect(initials('ágape')).toBe('ÁG');
  });

  it('should ignore symbols and extra spaces', () => {
    expect(initials('  Tienda   #5 ')).toBe('T5');
    expect(initials('La Esquina!')).toBe('ES');
  });

  it('should return an empty string when there is no name', () => {
    expect(initials('')).toBe('');
    expect(initials(null)).toBe('');
    expect(initials('  - ')).toBe('');
  });
});
