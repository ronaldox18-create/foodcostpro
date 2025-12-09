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
        pdv: boolean;
        digitalMenu: boolean;
        integrations: boolean; // iFood, etc
    };
}

export const PLANS: Record<PlanType, PlanFeatures> = {
    free: {
        name: 'Gratuito',
        price: 0,
        features: {
            maxRecipes: 10,
            aiConsultant: false,
            financialReports: false,
            stockManagement: 'basic',
            tableManagement: true,
            loyaltySystem: false,
            whatsappIntegration: false,
            supportPriority: false,
            pdv: true,
            digitalMenu: false,
            integrations: false,
        },
    },
    starter: {
        name: 'Operação Local',
        price: 89.90,
        features: {
            maxRecipes: 'unlimited',
            aiConsultant: false,
            financialReports: false,
            stockManagement: 'basic',
            tableManagement: false,
            loyaltySystem: false,
            whatsappIntegration: false,
            supportPriority: false,
            pdv: false,
            digitalMenu: false,
            integrations: false,
        },
    },
    online: {
        name: 'Operação Online',
        price: 89.90,
        features: {
            maxRecipes: 'unlimited',
            aiConsultant: false,
            financialReports: false,
            stockManagement: 'basic',
            tableManagement: false,
            loyaltySystem: true,
            whatsappIntegration: true,
            supportPriority: false,
            pdv: false,
            digitalMenu: true,
            integrations: true,
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
            pdv: true,
            digitalMenu: true,
            integrations: true,
        },
    },

};
