/*
 * Minimal non-streaming Dialog for GlkApi — backs SAVE / RESTORE / transcripts
 * with localStorage. GlkApi stores whole files as plain byte arrays when
 * `streaming` is false, which suits a couple of small save slots perfectly.
 */

interface FileRef {
  filename: string;
  usage: string;
}

const KEY_PREFIX = "zork1:file:";

export class LocalDialog {
  streaming = false;

  file_clean_fixed_name(filename: string, _usage: number): string {
    return String(filename).replace(/[^a-zA-Z0-9_.-]/g, "_");
  }

  file_construct_ref(filename: string, usage: string, _gameid?: string): FileRef {
    return { filename, usage };
  }

  file_construct_temp_ref(usage: string): FileRef {
    return { filename: `temp-${usage}-${this.seq()}`, usage };
  }

  file_ref_exists(ref: FileRef): boolean {
    return localStorage.getItem(this.key(ref)) !== null;
  }

  file_remove_ref(ref: FileRef): void {
    localStorage.removeItem(this.key(ref));
  }

  file_read(ref: FileRef): number[] | null {
    const raw = localStorage.getItem(this.key(ref));
    if (raw === null) return null;
    try {
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch {
      return [];
    }
  }

  file_write(ref: FileRef, content: number[] | string, _israw?: boolean): void {
    const data = typeof content === "string" ? [] : content;
    localStorage.setItem(this.key(ref), JSON.stringify(data));
  }

  // Some GlkApi paths probe this even in non-streaming mode.
  file_fopen(): null {
    return null;
  }

  private key(ref: FileRef): string {
    return KEY_PREFIX + ref.filename;
  }

  private _seq = 0;
  private seq(): number {
    return ++this._seq;
  }
}
