import type { ValidationChecks } from 'langium';
import type { WhileStarLanguageSupportAstType } from './generated/ast.js';
import type { WhileStarServices } from './while-star-module.js';

/**
 * Register custom validation checks.
 */
export function registerValidationChecks(services: WhileStarServices) {
    const registry = services.validation.ValidationRegistry;
    const validator = services.validation.WhileStarValidator;
    const checks: ValidationChecks<WhileStarLanguageSupportAstType> = {
        // Add custom validation checks here when needed
    };
    registry.register(checks, validator);
}

/**
 * Implementation of custom validations.
 */
export class WhileStarValidator {
    // Add custom validation methods here when needed
}
