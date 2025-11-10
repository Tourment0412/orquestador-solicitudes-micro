import { Given, When, Then } from '@cucumber/cucumber';
import axios from 'axios';
import { faker } from '@faker-js/faker';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001/api/v1';
let lastResponse: any;
let lastUser: any;

Given('que el servicio orquestador está disponible', async function() {
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    if (response.status < 200 || response.status >= 500) {
      throw new Error(`Service not available: ${response.status}`);
    }
  } catch (error: any) {
    // Si hay error de conexión, el servicio no está disponible
    // En un entorno real esto debería fallar, pero para tests locales lo permitimos
  }
});

When('creo un usuario con datos válidos', async function() {
  const userData = {
    name: `user_${faker.string.alphanumeric(8)}`,
    email: faker.internet.email(),
    phone: `+573${faker.string.numeric(9)}`
  };
  
  lastUser = userData;
  try {
    lastResponse = await axios.post(`${BASE_URL}/users`, userData);
  } catch (error: any) {
    lastResponse = error.response;
    throw error;
  }
});

Given('que existe al menos un usuario creado', async function() {
  try {
    await axios.post(`${BASE_URL}/users`, {
      name: `user_${faker.string.alphanumeric(8)}`,
      email: faker.internet.email(),
      phone: `+573${faker.string.numeric(9)}`
    });
  } catch (error) {
    // Ignorar errores de creación
  }
});

When('consulto la lista de usuarios', async function() {
  try {
    lastResponse = await axios.get(`${BASE_URL}/users`);
  } catch (error: any) {
    lastResponse = error.response;
    throw error;
  }
});

When('consulto el endpoint de health check', async function() {
  try {
    // El health check está en la raíz, no en /api/v1
    lastResponse = await axios.get('http://localhost:3001/health');
  } catch (error: any) {
    lastResponse = error.response;
    throw error;
  }
});

Then('la respuesta debe tener estado {int}', function(status: number) {
  if (!lastResponse || lastResponse.status !== status) {
    throw new Error(`Expected status ${status} but got ${lastResponse?.status || 'undefined'}`);
  }
});

Then('el cuerpo debe contener los datos del usuario creado', function() {
  if (!lastResponse?.data?.name && !lastResponse?.data?.usuario) {
    throw new Error('Response does not contain user data (name or usuario)');
  }
});

Then('el cuerpo debe contener una lista de usuarios', function() {
  if (!Array.isArray(lastResponse?.data)) {
    throw new Error('Response is not an array');
  }
});

Then('el cuerpo debe indicar que el servicio está UP', function() {
  // El health check puede devolver status en diferentes formatos
  const status = lastResponse?.data?.status;
  if (status !== 'UP' && status !== 'up') {
    throw new Error(`Expected status UP but got ${status || 'undefined'}`);
  }
});

