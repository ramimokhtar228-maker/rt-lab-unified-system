import React, { useState, useMemo } from 'react';
import { DiseaseIllustration } from '../types/lab';
import { cleanAtlasImageUrl, extractSvgFromDataUri } from '../utils/atlasImageUtils';
import { ZoomIn, Microscope, Download, Eye, Maximize2, X } from 'lucide-react';

interface ClinicalAtlasImageProps {
  illustration?: DiseaseIllustration | null;
  imageUrl?: string;
  alt?: string;
  className?: string;
  showReticle?: boolean;
  magnification?: string;
  allowZoom?: boolean;
}

export const ClinicalAtlasImage: React.FC<ClinicalAtlasImageProps> = ({
  illustration,
  imageUrl,
  alt = 'Clinical Atlas Illustration',
  className = 'w-full h-48',
  showReticle = true,
  magnification = '1000X Oil Immersion',
  allowZoom = true
}) => {
  const [hasError, setHasError] = useState(false);
  const [isZoomModalOpen, setIsZoomModalOpen] = useState(false);

  const rawUrl = imageUrl || illustration?.imageUrl;
  const safeUrl = useMemo(() => cleanAtlasImageUrl(rawUrl), [rawUrl]);
  const rawSvg = useMemo(() => extractSvgFromDataUri(safeUrl), [safeUrl]);

  const titleAr = illustration?.titleAr || 'أطلس الفحص المجهري السريري';
  const titleEn = illustration?.titleEn || alt;

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!safeUrl) return;
    const a = document.createElement('a');
    a.href = safeUrl;
    a.download = `${illustration?.code || 'atlas-slide'}-rt-lab.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <>
      <div
        className={`relative group rounded-xl overflow-hidden border border-rose-900/40 bg-slate-950 flex items-center justify-center select-none shadow-md ${className} ${
          allowZoom ? 'cursor-pointer' : ''
        }`}
        onClick={() => allowZoom && setIsZoomModalOpen(true)}
      >
        {/* Microscopic slide frame simulation */}
        {rawSvg && !hasError ? (
          <div
            className="w-full h-full flex items-center justify-center p-1 overflow-hidden [&>svg]:w-full [&>svg]:h-full [&>svg]:object-contain"
            dangerouslySetInnerHTML={{ __html: rawSvg }}
          />
        ) : safeUrl && !hasError ? (
          <img
            src={safeUrl}
            alt={titleEn}
            className="w-full h-full object-contain p-1"
            onError={() => setHasError(true)}
            loading="lazy"
          />
        ) : (
          /* Fallback clinical placeholder if image unavailable */
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-slate-950 via-rose-950/20 to-slate-950 text-slate-400">
            <Microscope className="w-8 h-8 text-rose-500/80 mb-2 animate-pulse" />
            <span className="text-xs font-bold text-slate-200">{titleAr}</span>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5" dir="ltr">
              {titleEn}
            </span>
            <span className="text-[9px] text-rose-400/90 mt-1.5 px-2 py-0.5 rounded bg-rose-950/60 border border-rose-800/40 font-mono">
              {magnification}
            </span>
          </div>
        )}

        {/* Reticle & Technical metadata overlay */}
        {showReticle && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5 pointer-events-none">
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900/80 text-rose-300 border border-rose-500/30 backdrop-blur-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
              {magnification}
            </span>
          </div>
        )}

        {/* Quick action controls on hover */}
        {allowZoom && (
          <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsZoomModalOpen(true);
              }}
              className="p-2 rounded-lg bg-rose-700 text-white hover:bg-rose-600 transition shadow-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <ZoomIn className="w-3.5 h-3.5" />
              <span>تكبير مجهري</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="p-2 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition shadow-lg text-xs font-bold flex items-center gap-1 cursor-pointer border border-slate-700"
              title="تحميل الرسم التوضيحي"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Full-screen Optical Reticle Zoom Modal */}
      {isZoomModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsZoomModalOpen(false)}
        >
          <div
            className="bg-slate-900 border border-rose-900/60 rounded-2xl max-w-4xl w-full p-5 text-white shadow-2xl relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-950 text-rose-400 rounded-xl border border-rose-700/50">
                  <Microscope className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">{titleAr}</h3>
                  <div className="text-xs text-rose-300 font-mono font-medium" dir="ltr">
                    {titleEn}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsZoomModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* High-Resolution Optical View Area */}
            <div className="relative w-full h-[65vh] bg-slate-950 rounded-xl border-2 border-rose-900/60 flex items-center justify-center overflow-hidden p-2">
              {/* Microscope Circular Field Mask effect */}
              <div className="absolute inset-0 pointer-events-none border-[30px] sm:border-[45px] border-slate-950/90 rounded-full opacity-60"></div>

              {/* Optical crosshair reticle overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-25">
                <div className="w-full h-px bg-rose-500"></div>
                <div className="h-full w-px bg-rose-500 absolute"></div>
                <div className="w-48 h-48 rounded-full border border-rose-400 absolute"></div>
              </div>

              {rawSvg ? (
                <div
                  className="w-full h-full flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:object-contain"
                  dangerouslySetInnerHTML={{ __html: rawSvg }}
                />
              ) : safeUrl ? (
                <img src={safeUrl} alt={titleEn} className="max-w-full max-h-full object-contain" />
              ) : null}

              {/* Metadata tags */}
              <div className="absolute bottom-3 right-3 bg-slate-900/90 px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-mono text-slate-300 backdrop-blur-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>RT High-Resolution Optical Smear</span>
                <span>•</span>
                <span className="text-rose-400 font-bold">{magnification}</span>
              </div>
            </div>

            {/* Pathology Summary & Diagnostic Highlights */}
            {illustration && (
              <div className="mt-3 pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="text-slate-300 leading-relaxed max-w-2xl">
                  <span className="font-bold text-rose-300 ml-1">الوصف المجهري الإكلينيكي:</span>
                  {illustration.pathologySummaryAr}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleDownload}
                    className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>تحميل الرسم</span>
                  </button>
                  <button
                    onClick={() => setIsZoomModalOpen(false)}
                    className="px-4 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-bold cursor-pointer"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
