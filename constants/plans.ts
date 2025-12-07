import { PlanType } from '../types';

export interface PlanFeatures {
    name: string;
    price: number;
    features: {
        maxRecipes: number | 'unlimited';
        aiConsultant: boolean;
        financialReports: boolean; // DRE, Lucro Real
        stockManagement: 'basic' | 'advanced'; // basic = apenas baixa; advanced = perda, yield, histórico
        tableManagement: boolean;
        loyaltySystem: boolean;
        whatsappIntegration: boolean;
        supportPriority: boolean;
    };
}

export const PLANS: Record<PlanType, PlanFeatures> = {
    free: {
        name: 'Gratuito',
        price: 0,
        features: {
            maxRecipes: 15,
            aiConsultant: false,
            financialReports: false,
            stockManagement: 'basic',
            tableManagement: false,
            loyaltySystem: false,
            whatsappIntegration: false,
            supportPriority: false,
        },
    },
    starter: {
        name: 'Operação Local',
        price: 89.90,
        features: {
            maxRecipes: 'unlimited',
            aiConsultant: false,
            financialReports: true,
            stockManagement: 'basic',
            tableManagement: true,
            loyaltySystem: false,
            whatsappIntegration: false,
            supportPriority: false,
        },
    },
    pro: {
        name: 'FoodCost PRO',
        price: 149.90,
        features: {
            maxRecipes: 'unlimited',
            aiConsultant: true,
            financialReports: true,
            stockManagement: 'advanced',
            tableManagement: true,
            loyaltySystem: true,
            whatsappIntegration: true,
            supportPriority: true,
        },
    },
};
