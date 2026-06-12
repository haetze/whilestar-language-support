import * as assert from 'assert';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import { normalizeStoredProgramUrl } from '../storedProgramUrl';
// import * as myExtension from '../../extension';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

	test('Stored program URLs use the public Wiz origin', () => {
		assert.strictEqual(
			normalizeStoredProgramUrl('http://127.0.0.1:8080/program/abc123\n'),
			'https://wiz.cs.tu-dortmund.de/program/abc123'
		);
		assert.strictEqual(
			normalizeStoredProgramUrl('http://localhost:8080/program/abc123?mode=edit#proof'),
			'https://wiz.cs.tu-dortmund.de/program/abc123?mode=edit#proof'
		);
		assert.strictEqual(
			normalizeStoredProgramUrl('/program/abc123'),
			'https://wiz.cs.tu-dortmund.de/program/abc123'
		);
		assert.strictEqual(
			normalizeStoredProgramUrl('http://wiz.cs.tu-dortmund.de/program/abc123'),
			'https://wiz.cs.tu-dortmund.de/program/abc123'
		);
		assert.strictEqual(
			normalizeStoredProgramUrl('https://example.test/program/abc123'),
			'https://example.test/program/abc123'
		);
		assert.strictEqual(
			normalizeStoredProgramUrl('not a url'),
			'not a url'
		);
	});
});
