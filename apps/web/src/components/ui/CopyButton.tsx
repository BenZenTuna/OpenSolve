'use client';

import { useState } from 'react';
import { Copy, Check, Download } from 'lucide-react';

interface CopyButtonProps {
  text: string;
  label?: string;
}

export function CopyButton({ text, label = 'Copy' }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-navy-800 border border-navy-700 text-gray-400 hover:text-gray-200 hover:border-navy-600 transition-colors cursor-pointer"
      title={label}
    >
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied' : label}
    </button>
  );
}

interface CopyDownloadButtonsProps {
  url: string;
  filename: string;
}

export function CopyDownloadButtons({ url, filename }: CopyDownloadButtonsProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <span className="inline-flex items-center gap-1 ml-1">
      <button
        onClick={handleCopy}
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-medium bg-navy-800 border border-navy-700 text-gray-400 hover:text-gray-200 hover:border-navy-600 transition-colors cursor-pointer"
        title="Copy link"
      >
        {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
      </button>
      <a
        href={url}
        download={filename}
        className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-medium bg-navy-800 border border-navy-700 text-gray-400 hover:text-gray-200 hover:border-navy-600 transition-colors"
        title={`Download ${filename}`}
      >
        <Download className="w-3 h-3" />
      </a>
    </span>
  );
}
