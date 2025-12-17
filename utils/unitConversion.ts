/**
 * Converte valores entre diferentes unidades de medida
 * Útil para comparar estoque de ingredientes com quantidades usadas em receitas e complementos
 */

export type UnitType = 'g' | 'kg' | 'ml' | 'l' | 'un';

/**
 * Converte um valor de uma unidade para outra
 * @param value - Valor a converter
 * @param fromUnit - Unidade de origem
 * @param toUnit - Unidade de destino
 * @returns Valor convertido
 */
export function convertUnits(value: number, fromUnit: UnitType, toUnit: UnitType): number {
    // Se as unidades são iguais, retorna o valor original
    if (fromUnit === toUnit) {
        return value;
    }

    // Conversões de peso
    if (fromUnit === 'kg' && toUnit === 'g') {
        return value * 1000;
    }
    if (fromUnit === 'g' && toUnit === 'kg') {
        return value / 1000;
    }

    // Conversões de volume
    if (fromUnit === 'l' && toUnit === 'ml') {
        return value * 1000;
    }
    if (fromUnit === 'ml' && toUnit === 'l') {
        return value / 1000;
    }

    // Se não houver conversão possível (ex: g -> ml), retorna o valor original
    // Isso evita erros mas pode indicar configuração incorreta
    console.warn(`Conversão não suportada: ${fromUnit} -> ${toUnit}`);
    return value;
}

/**
 * Verifica se há estoque suficiente de um ingrediente
 * @param availableStock - Estoque disponível
 * @param availableUnit - Unidade do estoque
 * @param neededAmount - Quantidade necessária
 * @param neededUnit - Unidade da quantidade necessária
 * @returns true se há estoque suficiente
 */
export function hasEnoughStock(
    availableStock: number,
    availableUnit: UnitType,
    neededAmount: number,
    neededUnit: UnitType
): boolean {
    // Converter quantidade necessária para a unidade do estoque
    const neededInStockUnit = convertUnits(neededAmount, neededUnit, availableUnit);
    return availableStock >= neededInStockUnit;
}

/**
 * Calcula o novo estoque após descontar uma quantidade
 * @param currentStock - Estoque atual
 * @param stockUnit - Unidade do estoque
 * @param toDeduct - Quantidade a descontar
 * @param deductUnit - Unidade da quantidade a descontar
 * @returns Novo valor do estoque (nunca menor que 0)
 */
export function deductFromStock(
    currentStock: number,
    stockUnit: UnitType,
    toDeduct: number,
    deductUnit: UnitType
): number {
    // Converter quantidade a descontar para a unidade do estoque
    const deductInStockUnit = convertUnits(toDeduct, deductUnit, stockUnit);
    const newStock = currentStock - deductInStockUnit;
    return Math.max(0, newStock); // Nunca retornar negativo
}
