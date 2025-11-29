import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { useApp } from './AppContext';
import { supabase } from '../utils/supabaseClient';
import NewOrderModal from '../components/NewOrderModal';

interface OrderItem {
    product_id: string;
    product_name: string;
    quantity: number;
    price: number;
    total: number;
}

interface Order {
    id: string;
    customer_id: string;
    customer_name: string;
    total_amount: number;
    status: string;
    payment_method: string;
    delivery_type?: string;
    delivery_address?: string;
    phone?: string;
    notes?: string;
    items?: OrderItem[];
}

interface OrderNotificationContextType {
    newOrder: Order | null;
    dismissNotification: () => void;
}

const OrderNotificationContext = createContext<OrderNotificationContextType | undefined>(undefined);

export const useOrderNotification = () => {
    const context = useContext(OrderNotificationContext);
    if (!context) {
        throw new Error('useOrderNotification must be used within OrderNotificationProvider');
    }
    return context;
};

export const OrderNotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();
    // Safe to use useApp here because OrderNotificationProvider is inside AppProvider in App.tsx
    const { handleStockUpdate } = useApp();

    const [newOrder, setNewOrder] = useState<Order | null>(null);
    const lastOrderIdRef = useRef<string | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Initialize AudioContext once to avoid delays
    useEffect(() => {
        try {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            console.log('🎵 Global AudioContext initialized');
        } catch (error) {
            console.error('❌ Error initializing AudioContext:', error);
        }

        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    // Subscribe to new orders
    useEffect(() => {
        if (!user?.id) {
            console.warn('⚠️ No user logged in - notifications disabled');
            return;
        }

        console.log('🔔 GLOBAL notification system initialized for user:', user.id);
        console.log('📡 Connecting to Supabase Realtime...');

        const channel = supabase
            .channel(`global-orders-notifications-${user.id}`, {
                config: {
                    broadcast: { self: true },
                },
            })
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'orders',
                    filter: `user_id=eq.${user.id}`
                },
                async (payload) => {
                    console.log('🎉🎉🎉 NEW ORDER RECEIVED IN GLOBAL CONTEXT!', payload);
                    const basicOrder = payload.new as Order;

                    // Avoid duplicate notifications
                    if (lastOrderIdRef.current === basicOrder.id) {
                        console.log('⚠️ Duplicate order notification ignored:', basicOrder.id);
                        return;
                    }
                    lastOrderIdRef.current = basicOrder.id;

                    console.log('📢 Processing new order:', {
                        id: basicOrder.id,
                        customer: basicOrder.customer_name,
                        amount: basicOrder.total_amount,
                        status: basicOrder.status
                    });

                    // Fetch complete order data with items
                    await fetchCompleteOrderData(basicOrder.id);

                    // Play notification sound IMMEDIATELY
                    playNotificationSound();
                }
            )
            .subscribe((status, err) => {
                if (err) {
                    console.error('❌ GLOBAL Realtime subscription error:', err);
                    return;
                }

                console.log('📡 GLOBAL Realtime status:', status);

                if (status === 'SUBSCRIBED') {
                    console.log('✅✅✅ Successfully subscribed to GLOBAL order notifications!');
                    console.log('🎧 Listening for new orders on ALL pages');
                    console.log('🔍 Filter: user_id =', user.id);
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('❌ Channel error - Realtime may not be enabled on Supabase');
                } else if (status === 'TIMED_OUT') {
                    console.error('⏱️ Connection timed out');
                } else if (status === 'CLOSED') {
                    console.warn('🔌 Channel closed');
                }
            });

        return () => {
            console.log('🔌 Unsubscribing from GLOBAL orders channel');
            supabase.removeChannel(channel);
        };
    }, [user?.id]);

    const fetchCompleteOrderData = async (orderId: string) => {
        try {
            console.log('📦 Fetching complete order data for:', orderId);

            // Fetch order with items from order_items table
            const { data: orderData, error: orderError } = await supabase
                .from('orders')
                .select('*')
                .eq('id', orderId)
                .single();

            if (orderError) {
                console.error('❌ Error fetching order:', orderError);
                return;
            }

            // Try to fetch order items (may not exist if migration not run)
            const { data: itemsData, error: itemsError } = await supabase
                .from('order_items')
                .select('*')
                .eq('order_id', orderId);

            if (itemsError) {
                console.warn('⚠️ Could not fetch order items (table may not exist):', itemsError);
            }

            const completeOrder: Order = {
                ...orderData,
                items: itemsData || []
            };

            console.log('✅ Complete order data fetched:', completeOrder);
            console.log('🎬 SHOWING MODAL NOW!');
            setNewOrder(completeOrder);

        } catch (error) {
            console.error('❌ Error in fetchCompleteOrderData:', error);
        }
    };

    const playNotificationSound = () => {
        console.log('🔊🔊🔊 PLAYING NOTIFICATION SOUND NOW!');

        const context = audioContextRef.current;
        if (!context) {
            console.error('❌ AudioContext not available');
            return;
        }

        try {
            // Resume context if suspended (required by some browsers)
            if (context.state === 'suspended') {
                context.resume().then(() => {
                    console.log('🎵 AudioContext resumed');
                });
            }

            const now = context.currentTime;

            // FIRST BEEP - Immediate and LOUD
            const osc1 = context.createOscillator();
            const gain1 = context.createGain();
            osc1.connect(gain1);
            gain1.connect(context.destination);
            osc1.frequency.value = 900;
            osc1.type = 'sine';
            gain1.gain.setValueAtTime(0.8, now);
            gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            osc1.start(now);
            osc1.stop(now + 0.3);

            // SECOND BEEP - 250ms later
            const osc2 = context.createOscillator();
            const gain2 = context.createGain();
            osc2.connect(gain2);
            gain2.connect(context.destination);
            osc2.frequency.value = 1100;
            osc2.type = 'sine';
            gain2.gain.setValueAtTime(0.8, now + 0.25);
            gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.55);
            osc2.start(now + 0.25);
            osc2.stop(now + 0.55);

            // THIRD BEEP - Strongest, 500ms later
            const osc3 = context.createOscillator();
            const gain3 = context.createGain();
            osc3.connect(gain3);
            gain3.connect(context.destination);
            osc3.frequency.value = 1300;
            osc3.type = 'sine';
            gain3.gain.setValueAtTime(0.9, now + 0.5);
            gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.9);
            osc3.start(now + 0.5);
            osc3.stop(now + 0.9);

            console.log('✅ Sound scheduled and playing!');
        } catch (error) {
            console.error('❌ Error playing sound:', error);
        }
    };

    const dismissNotification = () => {
        console.log('✖️ Dismissing notification for order:', newOrder?.id);
        setNewOrder(null);
    };

    const handleAcceptOrder = async (orderId: string) => {
        console.log('✅ Accepting order:', orderId);
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: 'confirmed' })
                .eq('id', orderId);

            if (error) throw error;

            // BAIXAR ESTOQUE
            const order = newOrder?.id === orderId ? newOrder : null;
            if (order && order.items && order.items.length > 0) {
                console.log('📉 Updating stock for accepted order items...');
                const itemsToDeduct = order.items.map(item => ({
                    productId: item.product_id,
                    productName: item.product_name,
                    quantity: item.quantity,
                    unitPrice: item.price,
                    total: item.total
                }));
                await handleStockUpdate(itemsToDeduct);
            }

            console.log('✅ Order accepted successfully');
            dismissNotification();
        } catch (error) {
            console.error('❌ Error accepting order:', error);
            alert('Erro ao aceitar pedido');
        }
    };

    const handleRejectOrder = async (orderId: string) => {
        console.log('❌ Rejecting order:', orderId);
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: 'cancelled' })
                .eq('id', orderId);

            if (error) throw error;
            console.log('✅ Order rejected successfully');
            dismissNotification();
        } catch (error) {
            console.error('❌ Error rejecting order:', error);
            alert('Erro ao rejeitar pedido');
        }
    };

    return (
        <OrderNotificationContext.Provider value={{ newOrder, dismissNotification }}>
            {children}

            {/* Global Notification Modal */}
            {newOrder && (
                <NewOrderModal
                    order={newOrder}
                    onAccept={() => handleAcceptOrder(newOrder.id)}
                    onReject={() => handleRejectOrder(newOrder.id)}
                    onDismiss={dismissNotification}
                />
            )}
        </OrderNotificationContext.Provider>
    );
};
