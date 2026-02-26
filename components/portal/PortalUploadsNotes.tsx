import React from 'react';

interface PortalUploadsNotesProps {
    note: string;
    setNote: (note: string) => void;
}

const PortalUploadsNotes: React.FC<PortalUploadsNotesProps> = ({ note, setNote }) => {
    return (
        <div className="space-y-6">
            <div className="bg-gray-800 rounded-2xl shadow-sm border border-gray-700 p-6">
                <h3 className="font-bold text-white mb-2 text-sm">Notas Adicionales</h3>
                <textarea 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-600 rounded-xl p-3 text-sm text-white focus:ring-2 focus:ring-primary/50 outline-none resize-none h-20 placeholder-gray-600"
                    placeholder="Instrucciones especiales para el receptor..."
                />
            </div>
        </div>
    );
};

export default PortalUploadsNotes;