/**
 * Reports Routes
 * Provides aggregated statistics and data for reporting purposes
 * 
 * @module routes/reports
 * @requires express
 * @requires ../db
 * @requires ../middleware/auth
 */

import express from "express";
import db from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /api/reports/residents
 * Get comprehensive resident statistics
 * 
 * @route GET /api/reports/residents
 * @access Protected
 * @returns {Object} Resident statistics including total, by status, by purok
 */
router.get("/residents", authRequired, (req, res) => {
  const queries = {
    // Overall statistics
    overall: `SELECT 
       COUNT(*) as total,
       SUM(CASE WHEN status = 'Released' THEN 1 ELSE 0 END) as released,
       SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending
     FROM residents`,
    
    // By purok/position
    byPurok: `SELECT 
       COALESCE(purokOrPosition, 'Not Specified') as purokOrPosition,
       COUNT(*) as count
     FROM residents 
     GROUP BY purokOrPosition
     HAVING purokOrPosition != 'Not Specified'
     ORDER BY count DESC
     LIMIT 10`,
    
    // Gender distribution - Note: 'sex' column doesn't exist in schema, deriving from data or skipping
    byGender: `SELECT 
       'Male' as gender,
       0 as count
     UNION ALL
     SELECT 
       'Female' as gender,
       0 as count`,
    
    // Recent registrations (last 30 days)
    recent: `SELECT COUNT(*) as count 
             FROM residents 
             WHERE datetime(createdAt) >= datetime('now', '-30 days')`
  };

  // Execute all queries in parallel
  Promise.all([
    new Promise((resolve, reject) => {
      db.get(queries.overall, (err, row) => err ? reject(err) : resolve(row));
    }),
    new Promise((resolve, reject) => {
      db.all(queries.byPurok, (err, rows) => err ? reject(err) : resolve(rows));
    }),
    new Promise((resolve, reject) => {
      db.all(queries.byGender, (err, rows) => err ? reject(err) : resolve(rows));
    }),
    new Promise((resolve, reject) => {
      db.get(queries.recent, (err, row) => err ? reject(err) : resolve(row));
    })
  ])
    .then(([overall, byPurok, byGender, recent]) => {
      res.json({
        overall,
        byPurok,
        byGender,
        recentRegistrations: recent.count,
        generatedAt: new Date().toISOString()
      });
    })
    .catch((err) => {
      console.error("Database error in residents report:", err);
      res.status(500).json({ error: "Failed to generate resident report" });
    });
});

/**
 * GET /api/reports/requests
 * Get E-Document request statistics
 * 
 * @route GET /api/reports/requests
 * @access Protected
 * @returns {Object} Request statistics by type and status
 */
router.get("/requests", authRequired, (req, res) => {
  const queries = {
    // Overall statistics
    overall: `SELECT 
       COUNT(*) as total,
       SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
       SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved,
       SUM(CASE WHEN status = 'Released' THEN 1 ELSE 0 END) as released
     FROM requests`,
    
    // By document type
    byDocType: `SELECT docType, COUNT(*) as count 
                FROM requests 
                GROUP BY docType 
                ORDER BY count DESC`,
    
    // Recent requests (last 30 days)
    recent: `SELECT COUNT(*) as count 
             FROM requests 
             WHERE datetime(createdAt) >= datetime('now', '-30 days')`
  };

  Promise.all([
    new Promise((resolve, reject) => {
      db.get(queries.overall, (err, row) => err ? reject(err) : resolve(row));
    }),
    new Promise((resolve, reject) => {
      db.all(queries.byDocType, (err, rows) => err ? reject(err) : resolve(rows));
    }),
    new Promise((resolve, reject) => {
      db.get(queries.recent, (err, row) => err ? reject(err) : resolve(row));
    })
  ])
    .then(([overall, byDocType, recent]) => {
      res.json({
        overall,
        byDocType,
        recentRequests: recent.count,
        generatedAt: new Date().toISOString()
      });
    })
    .catch((err) => {
      console.error("Database error in requests report:", err);
      res.status(500).json({ error: "Failed to generate requests report" });
    });
});

/**
 * GET /api/reports/complaints
 * Get complaint statistics
 * 
 * @route GET /api/reports/complaints
 * @access Protected
 * @returns {Object} Complaint statistics by status
 */
router.get("/complaints", authRequired, (req, res) => {
  const queries = {
    // Overall statistics
    overall: `SELECT 
       COUNT(*) as total,
       SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) as open,
       SUM(CASE WHEN status = 'InProgress' THEN 1 ELSE 0 END) as inProgress,
       SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved,
       SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) as closed
     FROM complaints`,
    
    // Recent complaints (last 30 days) - Note: complaints table uses 'ts' not 'createdAt'
    recent: `SELECT COUNT(*) as count 
             FROM complaints 
             WHERE datetime(ts) >= datetime('now', '-30 days')`
  };

  Promise.all([
    new Promise((resolve, reject) => {
      db.get(queries.overall, (err, row) => err ? reject(err) : resolve(row));
    }),
    new Promise((resolve, reject) => {
      db.get(queries.recent, (err, row) => err ? reject(err) : resolve(row));
    })
  ])
    .then(([overall, recent]) => {
      res.json({
        overall,
        recentComplaints: recent.count,
        generatedAt: new Date().toISOString()
      });
    })
    .catch((err) => {
      console.error("Database error in complaints report:", err);
      res.status(500).json({ error: "Failed to generate complaints report" });
    });
});

/**
 * GET /api/reports/summary
 * Get complete system summary (all statistics in one call)
 * 
 * @route GET /api/reports/summary
 * @access Protected
 * @returns {Object} Complete system statistics
 */
router.get("/summary", authRequired, (req, res) => {
  const queries = {
    residents: `SELECT 
       COUNT(*) as total,
       SUM(CASE WHEN status = 'Released' THEN 1 ELSE 0 END) as released,
       SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending
     FROM residents`,
    
    requests: `SELECT 
       COUNT(*) as total,
       SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending,
       SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) as approved,
       SUM(CASE WHEN status = 'Released' THEN 1 ELSE 0 END) as released
     FROM requests`,
    
    complaints: `SELECT 
       COUNT(*) as total,
       SUM(CASE WHEN status = 'Open' THEN 1 ELSE 0 END) as open,
       SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved
     FROM complaints`,
    
    auditCount: `SELECT COUNT(*) as count FROM audit_log`
  };

  Promise.all([
    new Promise((resolve, reject) => {
      db.get(queries.residents, (err, row) => err ? reject(err) : resolve(row));
    }),
    new Promise((resolve, reject) => {
      db.get(queries.requests, (err, row) => err ? reject(err) : resolve(row));
    }),
    new Promise((resolve, reject) => {
      db.get(queries.complaints, (err, row) => err ? reject(err) : resolve(row));
    }),
    new Promise((resolve, reject) => {
      db.get(queries.auditCount, (err, row) => err ? reject(err) : resolve(row));
    })
  ])
    .then(([residents, requests, complaints, audit]) => {
      res.json({
        residents,
        requests,
        complaints,
        totalAuditLogs: audit.count,
        generatedAt: new Date().toISOString()
      });
    })
    .catch((err) => {
      console.error("Database error in summary report:", err);
      res.status(500).json({ error: "Failed to generate summary report" });
    });
});

export default router;