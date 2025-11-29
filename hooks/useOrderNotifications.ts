import { useEffect, useRef, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

interface Order {
    id: string;
    customer_id: string;
    customer_name: string;
    total_amount: number;
    status: string;
    payment_method: string;
}

export const useOrderNotifications = (userId: string | undefined) => {
    const [newOrder, setNewOrder] = useState<Order | null>(null);
    const lastOrderIdRef = useRef<string | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Initialize AudioContext once to avoid delays
    useEffect(() => {
        try {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            console.log('🎵 AudioContext initialized');
        } catch (error) {
            console.error('❌ Error initializing AudioContext:', error);
        }

        return () => {
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
        };
    }, []);

    useEffect(() => {
        if (!userId) {
            console.warn('⚠️ No userId provided to useOrderNotifications');
            return;
        }

        console.log('🔔 Initializing notification system for user:', userId);
        console.log('📡 Connecting to Supabase Realtime...');

        // Subscribe to new orders with enhanced error handling
        const channel = supabase
            .channel(`orders-notifications-${userId}`, {
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
                    filter: `user_id=eq.${userId}`
                },
                (payload) => {
                    console.log('🎉 NEW ORDER RECEIVED!', payload);
                    const order = payload.new as Order;

                    // Avoid duplicate notifications
                    if (lastOrderIdRef.current === order.id) {
                        console.log('⚠️ Duplicate order notification ignored:', order.id);
                        return;
                    }
                    lastOrderIdRef.current = order.id;

                    console.log('📢 Processing new order:', {
                        id: order.id,
                        customer: order.customer_name,
                        amount: order.total_amount,
                        status: order.status
                    });

                    // Play notification sound IMMEDIATELY
                    playNotificationSound();

                    // Set new order for modal
                    console.log('✅ Showing modal for order:', order.id);
                    setNewOrder(order);
                }
            )
            .subscribe((status, err) => {
                if (err) {
                    console.error('❌ Realtime subscription error:', err);
                    return;
                }

                console.log('📡 Realtime status:', status);

                if (status === 'SUBSCRIBED') {
                    console.log('✅ Successfully subscribed to order notifications!');
                    console.log('🎧 Listening for new orders on table: orders');
                    console.log('🔍 Filter: user_id =', userId);
                } else if (status === 'CHANNEL_ERROR') {
                    console.error('❌ Channel error - Realtime may not be enabled on Supabase');
                } else if (status === 'TIMED_OUT') {
                    console.error('⏱️ Connection timed out');
                } else if (status === 'CLOSED') {
                    console.warn('🔌 Channel closed');
                }
            });

        return () => {
            console.log('🔌 Unsubscribing from orders channel');
            supabase.removeChannel(channel);
        };
    }, [userId]);

    const playNotificationSound = () => {
        console.log('🔊 PLAYING NOTIFICATION SOUND NOW!');

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

            // FIRST BEEP - Immediate
            const osc1 = context.createOscillator();
            const gain1 = context.createGain();
            osc1.connect(gain1);
            gain1.connect(context.destination);
            osc1.frequency.value = 900;
            osc1.type = 'sine';
            gain1.gain.setValueAtTime(0.6, now);
            gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            osc1.start(now);
            osc1.stop(now + 0.2);

            // SECOND BEEP - 200ms later
            const osc2 = context.createOscillator();
            const gain2 = context.createGain();
            osc2.connect(gain2);
            gain2.connect(context.destination);
            osc2.frequency.value = 1100;
            osc2.type = 'sine';
            gain2.gain.setValueAtTime(0.6, now + 0.2);
            gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
            osc2.start(now + 0.2);
            osc2.stop(now + 0.4);

            // THIRD BEEP - Strongest, 400ms later
            const osc3 = context.createOscillator();
            const gain3 = context.createGain();
            osc3.connect(gain3);
            gain3.connect(context.destination);
            osc3.frequency.value = 1300;
            osc3.type = 'sine';
            gain3.gain.setValueAtTime(0.7, now + 0.4);
            gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.7);
            osc3.start(now + 0.4);
            osc3.stop(now + 0.7);

            console.log('✅ Sound scheduled successfully');
        } catch (error) {
            console.error('❌ Error playing sound:', error);
        }
    };

    const dismissNotification = () => {
        console.log('✖️ Dismissing notification for order:', newOrder?.id);
        setNewOrder(null);
    };

    return { newOrder, dismissNotification };
};
