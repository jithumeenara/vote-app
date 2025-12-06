import React, { useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { Edit, Trash2, Save, X } from 'lucide-react';
import LoadingSpinner from '../../../components/LoadingSpinner';
import ConfirmModal from '../../../components/ConfirmModal';
import { useAuth } from '../../../context/AuthContext';

export default function ManageBooths() {
    const [panchayats, setPanchayats] = useState([]);
    const [wards, setWards] = useState([]);
    const [selectedPanchayat, setSelectedPanchayat] = useState('');
    const [selectedWard, setSelectedWard] = useState('');
    const [booths, setBooths] = useState([]);
    const [loading, setLoading] = useState(false);

    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editBoothNo, setEditBoothNo] = useState('');
    const [editContactNumber, setEditContactNumber] = useState('');

    const [deleteId, setDeleteId] = useState(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const { user } = useAuth();
    const isWardMember = user?.role === 'ward_member';

    useEffect(() => {
        fetchPanchayats();
        if (isWardMember && user?.ward_id) {
            fetchUserWardDetails();
        }
    }, [user]);

    async function fetchUserWardDetails() {
        const { data } = await supabase
            .from('wards')
            .select('id, panchayat_id')
            .eq('id', user.ward_id)
            .single();

        if (data) {
            setSelectedPanchayat(data.panchayat_id);
            setSelectedWard(data.id);
        }
    }

    useEffect(() => {
        if (selectedPanchayat) {
            fetchWards(selectedPanchayat);
        } else {
            setWards([]);
            setBooths([]);
        }
    }, [selectedPanchayat]);

    useEffect(() => {
        if (selectedWard) {
            fetchBooths(selectedWard);
        } else {
            setBooths([]);
        }
    }, [selectedWard]);

    async function fetchPanchayats() {
        const { data } = await supabase.from('panchayats').select('*').order('name');
        setPanchayats(data || []);
    }

    async function fetchWards(panchayatId) {
        const { data } = await supabase.from('wards').select('*').eq('panchayat_id', panchayatId).order('ward_no');
        setWards(data || []);
    }

    async function fetchBooths(wardId) {
        setLoading(true);
        const { data } = await supabase.from('booths').select('*').eq('ward_id', wardId).order('booth_no');
        setBooths(data || []);
        setLoading(false);
    }

    function confirmDelete(id) {
        setDeleteId(id);
        setIsDeleteModalOpen(true);
    }

    async function handleDelete() {
        if (!deleteId) return;

        const { error } = await supabase.from('booths').delete().eq('id', deleteId);
        if (error) {
            alert('പിശക്: ' + error.message);
        } else {
            setBooths(booths.filter(b => b.id !== deleteId));
        }
        setDeleteId(null);
    }

    function startEdit(booth) {
        setEditingId(booth.id);
        setEditName(booth.name);
        setEditBoothNo(booth.booth_no);
        setEditContactNumber(booth.contact_number || '');
    }

    async function saveEdit(id) {
        const { error } = await supabase.from('booths').update({
            name: editName,
            booth_no: parseInt(editBoothNo),
            contact_number: editContactNumber
        }).eq('id', id);

        if (error) {
            alert('പിശക്: ' + error.message);
        } else {
            setBooths(booths.map(b => b.id === id ? { ...b, name: editName, booth_no: parseInt(editBoothNo), contact_number: editContactNumber } : b));
            setEditingId(null);
        }
    }

    return (
        <div className="container">
            <h2 style={{ marginBottom: '2rem', color: 'var(--primary-bg)' }}>ബൂത്തുകൾ നിയന്ത്രിക്കുക</h2>

            <div className="grid grid-2" style={{ marginBottom: '2rem' }}>
                <div className="form-group">
                    <label className="label">പഞ്ചായത്ത് തിരഞ്ഞെടുക്കുക</label>
                    <select
                        className="input"
                        value={selectedPanchayat}
                        onChange={e => setSelectedPanchayat(e.target.value)}
                        disabled={isWardMember}
                    >
                        <option value="">-- തിരഞ്ഞെടുക്കുക --</option>
                        {panchayats.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label className="label">വാർഡ് തിരഞ്ഞെടുക്കുക</label>
                    <select
                        className="input"
                        value={selectedWard}
                        onChange={e => setSelectedWard(e.target.value)}
                        disabled={!selectedPanchayat || isWardMember}
                    >
                        <option value="">-- തിരഞ്ഞെടുക്കുക --</option>
                        {wards.map(w => (
                            <option key={w.id} value={w.id}>{w.ward_no} - {w.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {loading ? <LoadingSpinner /> : (
                <div className="grid">
                    {booths.map((booth) => (
                        <div key={booth.id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            {editingId === booth.id ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1 }}>
                                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                        <input
                                            className="input"
                                            type="number"
                                            style={{ width: '80px' }}
                                            value={editBoothNo}
                                            onChange={e => setEditBoothNo(e.target.value)}
                                            placeholder="No."
                                        />
                                        <input
                                            className="input"
                                            style={{ flex: 1 }}
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            placeholder="Name"
                                        />
                                    </div>
                                    <input
                                        className="input"
                                        value={editContactNumber}
                                        onChange={e => setEditContactNumber(e.target.value)}
                                        placeholder="Phone Number"
                                    />
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => saveEdit(booth.id)} className="btn btn-primary" style={{ padding: '0.5rem' }}>
                                            <Save size={20} /> Save
                                        </button>
                                        <button onClick={() => setEditingId(null)} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                                            <X size={20} /> Cancel
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                        <div style={{ fontSize: '0.9rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                                            ബൂത്ത് നമ്പർ: {booth.booth_no}
                                        </div>
                                        <div style={{ fontWeight: '700', fontSize: '1.2rem' }}>{booth.name}</div>
                                        {booth.contact_number && (
                                            <div style={{ fontSize: '0.9rem', color: '#666' }}>
                                                📞 {booth.contact_number}
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button onClick={() => startEdit(booth)} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                                            <Edit size={20} color="var(--primary)" />
                                        </button>
                                        <button onClick={() => confirmDelete(booth.id)} className="btn btn-secondary" style={{ padding: '0.5rem', borderColor: 'var(--danger)' }}>
                                            <Trash2 size={20} color="var(--danger)" />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                    {selectedWard && booths.length === 0 && (
                        <div style={{ color: 'var(--text-light)' }}>ബൂത്തുകളൊന്നും കണ്ടെത്തിയില്ല.</div>
                    )}
                </div>
            )}

            <ConfirmModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="ബൂത്ത് ഡിലീറ്റ് ചെയ്യണോ?"
                message="ഈ ബൂത്ത് ഡിലീറ്റ് ചെയ്താൽ ഇതിലുള്ള എല്ലാ വോട്ടർമാരും നഷ്ടപ്പെടും!"
            />
        </div>
    );
}
