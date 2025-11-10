import { UtilidadesService } from '../../services/utilities.service';
import fs from 'fs';
import path from 'path';

// Mock fs module
jest.mock('fs');

describe('UtilidadesService Unit Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('renderStringTemplate', () => {
    it('should render a simple string template with single variable', () => {
      const template = 'Hello {{name}}!';
      const data = { name: 'John' };

      const result = UtilidadesService.renderStringTemplate(template, data);

      expect(result).toBe('Hello John!');
    });

    it('should render a template with multiple variables', () => {
      const template = 'Hello {{name}}, your code is {{code}}';
      const data = { name: 'Alice', code: '123456' };

      const result = UtilidadesService.renderStringTemplate(template, data);

      expect(result).toBe('Hello Alice, your code is 123456');
    });

    it('should handle empty data object', () => {
      const template = 'Hello {{name}}!';
      const data = {};

      const result = UtilidadesService.renderStringTemplate(template, data);

      expect(result).toBe('Hello !');
    });

    it('should handle template with no variables', () => {
      const template = 'Hello World!';
      const data = { name: 'John' };

      const result = UtilidadesService.renderStringTemplate(template, data);

      expect(result).toBe('Hello World!');
    });

    it('should handle special characters in data', () => {
      const template = 'User: {{name}}';
      const data = { name: 'John <script>alert("xss")</script>' };

      const result = UtilidadesService.renderStringTemplate(template, data);

      // Handlebars escapes HTML by default
      expect(result).toContain('John');
    });

    it('should handle numeric values', () => {
      const template = 'Order #{{orderId}} - Total: ${{total}}';
      const data = { orderId: 12345, total: 99.99 };

      const result = UtilidadesService.renderStringTemplate(template, data);

      expect(result).toBe('Order #12345 - Total: $99.99');
    });

    it('should handle boolean values', () => {
      const template = 'Status: {{active}}';
      const data = { active: true };

      const result = UtilidadesService.renderStringTemplate(template, data);

      expect(result).toBe('Status: true');
    });

    it('should throw error on invalid template', () => {
      const template = 'Hello {{name';
      const data = { name: 'John' };

      expect(() => {
        UtilidadesService.renderStringTemplate(template, data);
      }).toThrow();
    });
  });

  describe('renderTemplate', () => {
    beforeEach(() => {
      // Reset all mocks before each test
      jest.resetAllMocks();
    });

    it('should render HTML template successfully', () => {
      const mockHtml = '<html><body>Hello {{name}}</body></html>';
      (fs.readFileSync as jest.Mock).mockReturnValue(mockHtml);

      const result = UtilidadesService.renderTemplate('email.html', { name: 'John' });

      expect(result).toContain('Hello John');
      expect(fs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining('email.html'),
        'utf-8'
      );
    });

    it('should render complex HTML template with multiple variables', () => {
      const mockHtml = `
        <html>
          <body>
            <h1>Hello {{userName}}</h1>
            <p>Your verification code is: {{verificationCode}}</p>
            <a href="{{link}}">Click here</a>
          </body>
        </html>
      `;
      (fs.readFileSync as jest.Mock).mockReturnValue(mockHtml);

      const data = {
        userName: 'Alice',
        verificationCode: '987654',
        link: 'https://example.com/verify'
      };

      const result = UtilidadesService.renderTemplate('verification.html', data);

      expect(result).toContain('Hello Alice');
      expect(result).toContain('987654');
      expect(result).toContain('https://example.com/verify');
    });

    it('should throw error when template file does not exist', () => {
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('ENOENT: no such file or directory');
      });

      expect(() => {
        UtilidadesService.renderTemplate('nonexistent.html', {});
      }).toThrow();

      expect(fs.readFileSync).toHaveBeenCalled();
    });

    it('should handle empty data object in HTML template', () => {
      const mockHtml = '<html><body>Static content</body></html>';
      (fs.readFileSync as jest.Mock).mockReturnValue(mockHtml);

      const result = UtilidadesService.renderTemplate('static.html', {});

      expect(result).toContain('Static content');
    });

    it('should construct correct path to template', () => {
      const mockHtml = '<html><body>Test</body></html>';
      (fs.readFileSync as jest.Mock).mockReturnValue(mockHtml);

      UtilidadesService.renderTemplate('test-template.html', {});

      expect(fs.readFileSync).toHaveBeenCalledWith(
        expect.stringContaining('test-template.html'),
        'utf-8'
      );
    });

    it('should handle nested data objects', () => {
      const mockHtml = '<html><body>Hello {{user.name}}, age {{user.age}}</body></html>';
      (fs.readFileSync as jest.Mock).mockReturnValue(mockHtml);

      const data = {
        user: {
          name: 'Bob',
          age: 30
        }
      };

      const result = UtilidadesService.renderTemplate('user-profile.html', data);

      expect(result).toContain('Hello Bob');
      expect(result).toContain('age 30');
    });

    it('should throw error on read permission issues', () => {
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('EACCES: permission denied');
      });

      expect(() => {
        UtilidadesService.renderTemplate('protected.html', {});
      }).toThrow();
    });
  });

  describe('Error handling', () => {
    it('should log error when renderTemplate fails', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('File not found');
      });

      expect(() => {
        UtilidadesService.renderTemplate('missing.html', {});
      }).toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error al renderizar la plantilla:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should log error when renderStringTemplate fails', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        UtilidadesService.renderStringTemplate('{{unclosed', {});
      }).toThrow();

      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});

