import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Download, Share2, Printer, Copy, Check } from 'lucide-react';

interface QRCodeGeneratorProps {
    url: string;
    logoUrl?: string;
    primaryColor?: string;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ url, logoUrl, primaryColor = '#ea580c' }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [copied, setCopied] = useState(false);
    const [qrGenerated, setQrGenerated] = useState(false);

    useEffect(() => {
        generateQRCode();
    }, [url, primaryColor, logoUrl]);

    const generateQRCode = async () => {
        if (!canvasRef.current || !url) return;

        try {
            // Gerar QR Code no canvas
            await QRCode.toCanvas(canvasRef.current, url, {
                width: 400,
                margin: 2,
                color: {
                    dark: primaryColor || '#000000',
                    light: '#FFFFFF',
                },
                errorCorrectionLevel: 'H', // Alta correção de erro para permitir logo no centro
            });

            // Se tiver logo, adicioná-la no centro
            if (logoUrl) {
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    const logo = new Image();
                    logo.crossOrigin = 'anonymous';
                    logo.onload = () => {
                        const logoSize = canvas.width * 0.2; // Logo ocupa 20% do QR Code
                        const x = (canvas.width - logoSize) / 2;
                        const y = (canvas.height - logoSize) / 2;

                        // Fundo branco atrás do logo
                        ctx.fillStyle = 'white';
                        ctx.fillRect(x - 10, y - 10, logoSize + 20, logoSize + 20);

                        // Desenhar logo
                        ctx.drawImage(logo, x, y, logoSize, logoSize);
                        setQrGenerated(true);
                    };
                    logo.src = logoUrl;
                }
            } else {
                setQrGenerated(true);
            }
        } catch (error) {
            console.error('Error generating QR Code:', error);
        }
    };

    const downloadQRCode = (format: 'png' | 'svg' = 'png') => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;

        if (format === 'png') {
            canvas.toBlob((blob) => {
                if (blob) {
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.download = `qrcode-cardapio-${Date.now()}.png`;
                    link.href = url;
                    link.click();
                    URL.revokeObjectURL(url);
                }
            });
        }
    };

    const copyLink = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const shareWhatsApp = () => {
        const message = encodeURIComponent(`Confira nosso cardápio digital: ${url}`);
        window.open(`https://wa.me/?text=${message}`, '_blank');
    };

    const printQRCode = () => {
        const printWindow = window.open('', '_blank');
        if (printWindow && canvasRef.current) {
            const canvas = canvasRef.current;
            const dataUrl = canvas.toDataURL();
            printWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>QR Code - Cardápio Digital</title>
                    <style>
                        body {
                            margin: 0;
                            padding: 40px;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            min-height: 100vh;
                            font-family: system-ui, -apple-system, sans-serif;
                        }
                        h1 {
                            margin-bottom: 20px;
                            font-size: 24px;
                            text-align: center;
                        }
                        img {
                            max-width: 400px;
                            border: 2px solid #e5e7eb;
                            border-radius: 16px;
                            padding: 20px;
                            background: white;
                        }
                        p {
                            margin-top: 20px;
                            text-align: center;
                            color: #6b7280;
                            font-size: 14px;
                        }
                        @media print {
                            @page {
                                margin: 2cm;
                            }
                        }
                    </style>
                </head>
                <body>
                    <h1>📱 Acesse Nosso Cardápio Digital</h1>
                    <img src="${dataUrl}" alt="QR Code do Cardápio" />
                    <p>${url}</p>
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
            }, 250);
        }
    };

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h3 className="text-xl font-black text-gray-900 mb-2">Seu QR Code Profissional</h3>
                <p className="text-sm text-gray-600">
                    Imprima e coloque em seu estabelecimento para que clientes acessem o cardápio digital
                </p>
            </div>

            {/* Canvas do QR Code */}
            <div className="flex justify-center">
                <div className="bg-white p-6 rounded-2xl border-2 border-gray-200 shadow-lg">
                    <canvas ref={canvasRef} className="max-w-full h-auto" />
                </div>
            </div>

            {/* Link */}
            <div className="bg-white rounded-xl p-4 border border-gray-200">
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={url}
                        readOnly
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono"
                    />
                    <button
                        onClick={copyLink}
                        className={`px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors ${copied
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {copied ? (
                            <>
                                <Check size={16} />
                                Copiado!
                            </>
                        ) : (
                            <>
                                <Copy size={16} />
                                Copiar
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Ações */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                    onClick={() => downloadQRCode('png')}
                    disabled={!qrGenerated}
                    className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <Download size={20} className="text-orange-600" />
                    </div>
                    <span className="text-xs font-bold text-gray-700">Download PNG</span>
                </button>

                <button
                    onClick={printQRCode}
                    disabled={!qrGenerated}
                    className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Printer size={20} className="text-blue-600" />
                    </div>
                    <span className="text-xs font-bold text-gray-700">Imprimir</span>
                </button>

                <button
                    onClick={shareWhatsApp}
                    className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all"
                >
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Share2 size={20} className="text-green-600" />
                    </div>
                    <span className="text-xs font-bold text-gray-700">Compartilhar</span>
                </button>

                <button
                    onClick={copyLink}
                    className="flex flex-col items-center gap-2 p-4 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all"
                >
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <Copy size={20} className="text-purple-600" />
                    </div>
                    <span className="text-xs font-bold text-gray-700">Copiar Link</span>
                </button>
            </div>

            {/* Dicas de Uso */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
                <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                    💡 Dicas de Uso
                </h4>
                <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Imprima em alta qualidade (mínimo 300 DPI)</li>
                    <li>• Coloque em locais visíveis: mesas, balcão, entrada</li>
                    <li>• Adicione uma chamada: "Veja nosso cardápio digital"</li>
                    <li>• Teste o QR Code antes de imprimir em grande quantidade</li>
                    <li>• Considere fazer adesivos ou displays de mesa</li>
                </ul>
            </div>
        </div>
    );
};

export default QRCodeGenerator;
