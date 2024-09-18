import {
    registerDecorator,
    ValidationArguments,
    ValidationOptions,
    ValidatorConstraint,
    ValidatorConstraintInterface
} from 'class-validator';

@ValidatorConstraint({ async: false })
class IsStringOrNumberConstraint implements ValidatorConstraintInterface {
    validate(value: any, _: ValidationArguments) {
        return typeof value === 'string' || typeof value === 'number';
    }

    defaultMessage(_: ValidationArguments) {
        return 'Field $property must be either a string or a number';
    }
}

export function IsStringOrNumber(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            constraints: [],
            validator: IsStringOrNumberConstraint
        });
    };
}
