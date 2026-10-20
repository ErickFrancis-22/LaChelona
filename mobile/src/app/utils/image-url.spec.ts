import { environment } from '../../environments/environment';
import { resolveImageUrl } from './image-url';

describe('resolveImageUrl', () => {
  const origin = new URL(environment.apiUrl).origin;

  it('should prefix relative paths with the backend origin', () => {
    expect(resolveImageUrl('/images/products/cer-001.png')).toBe(`${origin}/images/products/cer-001.png`);
    expect(resolveImageUrl('images/categories/agua.png')).toBe(`${origin}/images/categories/agua.png`);
  });

  it('should keep absolute URLs and null untouched', () => {
    expect(resolveImageUrl('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png');
    expect(resolveImageUrl(null)).toBeNull();
    expect(resolveImageUrl('')).toBeNull();
  });
});
