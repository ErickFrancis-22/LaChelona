import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideIonicAngular } from '@ionic/angular';
import { LoginPage } from './login.page';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideIonicAngular(), provideHttpClient(), provideRouter([])],
    });
    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should be invalid when username and password are empty', () => {
    expect(component.form.valid).toBe(false);
  });

  it('should be valid when username and password are filled', () => {
    component.form.setValue({ username: 'minisuper.elroble', password: 'secret' });
    expect(component.form.valid).toBe(true);
  });
});
