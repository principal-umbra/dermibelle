import React from 'react';
import { useNavigate } from 'react-router-dom';

interface PortalNavbarProps {
    brandPhone: string;
    brandEmail: string;
    brandWhatsapp: string;
    orderIdDisplay: string;
    onExit: () => void;
    supplierId?: string; // New prop for navigation
}

const PortalNavbar: React.FC<PortalNavbarProps> = ({ 
    brandPhone, brandEmail, brandWhatsapp, orderIdDisplay, onExit, supplierId 
}) => {
    const navigate = useNavigate();

    const handleBrandClick = () => {
        if (supplierId) {
            navigate(`/portal/dashboard/${supplierId}`);
        }
    };

    return (
        <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50 shadow-lg">
            <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
                <div 
                    className="flex items-center gap-4 cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={handleBrandClick}
                    title="Ir al Dashboard de Proveedor"
                >
                    <div className="w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                        <span className="material-icons">spa</span>
                    </div>
                    <div>
                        <h1 className="font-display font-bold text-xl tracking-tight text-white">Dermibelle</h1>
                        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-bold">Portal de Proveedores</p>
                    </div>
                </div>

                <div className="flex-1 flex justify-center mx-4">
                    <div className="hidden md:flex items-center gap-1 bg-gray-900/50 p-1.5 rounded-xl border border-gray-700/50">
                        <span className="text-[10px] font-bold text-gray-500 uppercase px-3">CONTACTO</span>
                        <button 
                            onClick={() => window.open(`https://wa.me/${brandWhatsapp}`, '_blank')}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-green-900/20 text-gray-300 hover:text-green-400 border border-gray-700 hover:border-green-500/30 transition-all group"
                            title="Chat por WhatsApp"
                        >
                            <span className="material-icons text-sm group-hover:scale-110 transition-transform">chat</span>
                            <span className="text-xs font-bold">WhatsApp</span>
                        </button>
                        <button 
                            onClick={() => window.location.href = `tel:${brandPhone}`}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-blue-900/20 text-gray-300 hover:text-blue-400 border border-gray-700 hover:border-blue-500/30 transition-all group"
                            title="Llamar"
                        >
                            <span className="material-icons text-sm group-hover:scale-110 transition-transform">phone</span>
                            <span className="text-xs font-bold">Llamar</span>
                        </button>
                        <button 
                            onClick={() => window.location.href = `mailto:${brandEmail}?subject=Consulta Orden ${orderIdDisplay}`}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-orange-900/20 text-gray-300 hover:text-orange-400 border border-gray-700 hover:border-orange-500/30 transition-all group"
                            title="Enviar Email"
                        >
                            <span className="material-icons text-sm group-hover:scale-110 transition-transform">email</span>
                            <span className="text-xs font-bold">Email</span>
                        </button>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right hidden sm:block">
                        <p className="text-xs text-gray-500 uppercase font-bold">Orden de Compra</p>
                        <p className="text-lg font-mono font-bold text-white">{orderIdDisplay}</p>
                    </div>
                    <button 
                        onClick={onExit}
                        className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 border border-gray-600"
                    >
                        <span className="material-icons text-sm">logout</span> Salir
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default PortalNavbar;