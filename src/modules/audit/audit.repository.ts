import { db } from '../../db/client.js';
import type { AuditResultRecord, AuditStatus } from './audit.types.js';

export function createPendingAudit(id: string, url: string): void {
  const stmt = db.prepare('INSERT INTO audit_results (id, url, status) VALUES (?, ?, ?)');
  stmt.run(id, url, 'pending');
}

export function updateAuditResult(id: string, result: any): void {
  const stmt = db.prepare('UPDATE audit_results SET status = ?, result = ?, updated_at = unixepoch() WHERE id = ?');
  stmt.run('completed', JSON.stringify(result), id);
}

export function markAuditFailed(id: string, error: string): void {
  const stmt = db.prepare('UPDATE audit_results SET status = ?, error = ?, updated_at = unixepoch() WHERE id = ?');
  stmt.run('failed', error, id);
}

export function getAuditById(id: string): AuditResultRecord | undefined {
  const stmt = db.prepare('SELECT * FROM audit_results WHERE id = ?');
  return stmt.get(id) as AuditResultRecord | undefined;
}

export function updateAuditProgress(id: string, status: AuditStatus, result: any): void {
  const stmt = db.prepare('UPDATE audit_results SET status = ?, result = ?, updated_at = unixepoch() WHERE id = ?');
  stmt.run(status, JSON.stringify(result), id);
}
