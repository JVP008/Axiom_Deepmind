
import React, { useState } from 'react';
import { BadgeCheck, ShieldCheck, Search, XCircle, CheckCircle } from 'lucide-react';

export const CertificateValidator: React.FC = () => {
  const [certId, setCertId] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'valid' | 'invalid'>('idle');

  const handleVerify = () => {
      if(!certId) return;
      setStatus('loading');
      setTimeout(() => {
          // Mock logic: IDs starting with 'VALID' are valid
          if(certId.toUpperCase().startsWith('VALID')) {
              setStatus('valid');
          } else {
              setStatus('invalid');
          }
      }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto pt-10">
        <div className="text-center mb-10">
            <div className="w-20 h-20 mx-auto bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard flex items-center justify-center mb-6">
                <BadgeCheck size={40} />
            </div>
            <h2 className="text-3xl font-black uppercase mb-2">Authenticity Validator</h2>
            <p className="font-mono text-slate-500">Secure Blockchain Verification System</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border-2 border-slate-900 dark:border-slate-100 shadow-hard p-8 relative">
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
                    <input 
                        type="text" 
                        value={certId}
                        onChange={(e) => setCertId(e.target.value)}
                        placeholder="ENTER CERTIFICATE ID (Try 'VALID123')" 
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-900 dark:border-slate-100 outline-none focus:bg-white font-mono uppercase text-lg"
                    />
                </div>
                <button 
                    onClick={handleVerify}
                    disabled={status === 'loading'}
                    className="px-8 py-3 bg-indigo-600 text-white font-bold uppercase border-2 border-slate-900 shadow-hard-sm hover:shadow-none hover:translate-y-1 transition-all disabled:opacity-50"
                >
                    {status === 'loading' ? 'Verifying...' : 'Verify Now'}
                </button>
            </div>

            {status === 'valid' && (
                <div className="animate-in slide-in-from-bottom-2 bg-green-100 dark:bg-green-900/30 border-2 border-green-600 p-6 flex items-start gap-4">
                    <CheckCircle className="text-green-600 shrink-0" size={32} />
                    <div>
                        <h3 className="text-xl font-black uppercase text-green-700 dark:text-green-400 mb-1">Certificate Valid</h3>
                        <p className="font-mono text-sm mb-2">Issued to: <span className="font-bold">Aarav Patel</span></p>
                        <p className="font-mono text-sm mb-2">Course: <span className="font-bold">Advanced Computer Science</span></p>
                        <p className="font-mono text-xs text-slate-500">Hash: 0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069</p>
                    </div>
                </div>
            )}

            {status === 'invalid' && (
                <div className="animate-in slide-in-from-bottom-2 bg-red-100 dark:bg-red-900/30 border-2 border-red-600 p-6 flex items-start gap-4">
                    <XCircle className="text-red-600 shrink-0" size={32} />
                    <div>
                        <h3 className="text-xl font-black uppercase text-red-700 dark:text-red-400 mb-1">Verification Failed</h3>
                        <p className="font-mono text-sm">The certificate ID provided could not be found in the blockchain ledger or has been revoked.</p>
                    </div>
                </div>
            )}

            {status === 'idle' && (
                 <div className="text-center py-8 border-2 border-dashed border-slate-300 dark:border-slate-700">
                    <ShieldCheck size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                    <p className="font-mono text-sm text-slate-400">Enter a unique Certificate ID to verify its authenticity.</p>
                 </div>
            )}
        </div>
    </div>
  );
};
