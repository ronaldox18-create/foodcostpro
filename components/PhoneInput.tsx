import React, { useState, useEffect } from 'react';
import { Phone } from 'lucide-react';

interface PhoneInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    label?: string;
    required?: boolean;
    className?: string;
}

/**
 * Input de telefone brasileiro profissional
 * - +55 fixo e sempre visível
 * - Formatação automática: +55 (11) 99999-9999
 * - Validação em tempo real
 * - Salva no formato: 5511999999999 (sem formatação)
 */
const PhoneInput: React.FC<PhoneInputProps> = ({
    value = '',
    onChange,
    placeholder = '(11) 99999-9999',
    label = 'WhatsApp / Telefone',
    required = false,
    className = ''
}) => {
    const [displayValue, setDisplayValue] = useState('');
    const [error, setError] = useState('');

    // Formatar número para exibição: (11) 99999-9999
    const formatPhoneDisplay = (phone: string): string => {
        // Remove tudo exceto números
        const numbers = phone.replace(/\D/g, '');

        // Remove o 55 se vier no início (já mostramos fixo)
        const withoutCountryCode = numbers.startsWith('55')
            ? numbers.substring(2)
            : numbers;

        // Formatar: (11) 99999-9999
        if (withoutCountryCode.length <= 2) {
            return withoutCountryCode;
        } else if (withoutCountryCode.length <= 7) {
            return `(${withoutCountryCode.slice(0, 2)}) ${withoutCountryCode.slice(2)}`;
        } else {
            return `(${withoutCountryCode.slice(0, 2)}) ${withoutCountryCode.slice(2, 7)}-${withoutCountryCode.slice(7, 11)}`;
        }
    };

    // Converter para formato de salvamento: 5511999999999
    const toSaveFormat = (phone: string): string => {
        const numbers = phone.replace(/\D/g, '');
        const withoutCountryCode = numbers.startsWith('55')
            ? numbers.substring(2)
            : numbers;

        // Adicionar +55 se tiver conteúdo
        return withoutCountryCode ? `55${withoutCountryCode}` : '';
    };

    // Validar número brasileiro
    const validatePhone = (phone: string): string => {
        const numbers = phone.replace(/\D/g, '');
        const withoutCountryCode = numbers.startsWith('55')
            ? numbers.substring(2)
            : numbers;

        if (!withoutCountryCode) {
            return ''; // Vazio é OK
        }

        if (withoutCountryCode.length < 10) {
            return 'Telefone incompleto (mínimo 10 dígitos)';
        }

        if (withoutCountryCode.length > 11) {
            return 'Telefone muito longo (máximo 11 dígitos)';
        }

        // Validar DDD (11-99)
        const ddd = parseInt(withoutCountryCode.substring(0, 2));
        if (ddd < 11 || ddd > 99) {
            return 'DDD inválido';
        }

        // Validar celular (9 dígitos começando com 9)
        if (withoutCountryCode.length === 11) {
            const firstDigit = withoutCountryCode[2];
            if (firstDigit !== '9') {
                return 'Celular deve começar com 9';
            }
        }

        return '';
    };

    // Inicializar com valor existente
    useEffect(() => {
        if (value) {
            setDisplayValue(formatPhoneDisplay(value));
            setError(validatePhone(value));
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;

        // Permitir apenas números e formatação
        const numbersOnly = inputValue.replace(/\D/g, '');

        // Limitar a 11 dígitos (sem o 55)
        const limited = numbersOnly.substring(0, 11);

        // Formatar para exibição
        const formatted = formatPhoneDisplay(limited);
        setDisplayValue(formatted);

        // Validar
        const validationError = validatePhone(limited);
        setError(validationError);

        // Salvar no formato correto: 5511999999999
        const saveValue = toSaveFormat(limited);
        onChange(saveValue);
    };

    const handleBlur = () => {
        // Validar ao sair do campo
        if (displayValue && required) {
            const validationError = validatePhone(displayValue);
            setError(validationError);
        }
    };

    return (
        <div className={`${className}`}>
            {label && (
                <label className="text-sm font-semibold text-gray-700 block mb-1">
                    {label}
                    {required && <span className="text-red-500 ml-1">*</span>}
                </label>
            )}

            <div className="relative">
                {/* Ícone de telefone */}
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <Phone size={18} />
                </div>

                {/* Prefix +55 fixo */}
                <div className="absolute left-11 top-1/2 -translate-y-1/2 text-gray-700 font-semibold bg-gray-50 px-2 py-1 rounded border-r border-gray-300">
                    +55
                </div>

                {/* Input do número */}
                <input
                    type="tel"
                    value={displayValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    className={`w-full pl-24 pr-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-sm transition-all ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                />
            </div>

            {/* Mensagem de erro */}
            {error && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                    <span>⚠️</span>
                    {error}
                </p>
            )}

            {/* Mensagem de sucesso */}
            {!error && displayValue && displayValue.replace(/\D/g, '').length >= 10 && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <span>✓</span>
                    Número válido para WhatsApp
                </p>
            )}

            {/* Dica */}
            {!displayValue && (
                <p className="text-xs text-gray-500 mt-1">
                    Digite apenas o DDD e número (ex: 11999999999)
                </p>
            )}
        </div>
    );
};

export default PhoneInput;
