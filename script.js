/**
 * Frontend API Integration Layer
 * Connects UI to Google Apps Script Blockchain Backend
 * Team CodeLEOS - GGSIPU
 */

const API_BASE_URL = "https://script.google.com/macros/s/AKfycbxleqW0AX_7mMh9P2q0hR5dYT3-XtgIPN0-hb48Nhblca0bUBuIeUyJwMvGmw35xwrF1Q/exec";

// ==================== 1. TEACHER PORTAL: SINGLE CERTIFICATE ====================
const issueForm = document.getElementById("issueCertForm");
if (issueForm) {
    issueForm.addEventListener("submit", async function(e) {
        e.preventDefault();

        const submitBtn = document.getElementById("btnSubmitSingle") || issueForm.querySelector("button[type='submit']");
        const originalText = submitBtn.textContent;
        submitBtn.textContent = "⏳ Mining Block & Generating PDF...";
        submitBtn.disabled = true;

        const dobInput = document.getElementById("student-dob");
        const templateInput = document.getElementById("cert-template");

        const payload = {
            studentName: document.getElementById("student-name").value.trim(),
            enrollmentNo: document.getElementById("enrollment-no").value.trim(),
            courseDept: document.getElementById("dept").value.trim(),
            eventTitle: document.getElementById("cert-type").value.trim(),
            dob: dobInput ? dobInput.value.trim() : "",
            template: templateInput ? templateInput.value : "template_1"
        };

        try {
            const response = await fetch(API_BASE_URL, {
                method: "POST",
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (data.status === "SUCCESS") {
                alert(`✅ Certificate Issued Successfully!\n\nCert ID: ${data.certId}\nBlock Index: #${data.blockIndex}\nSHA-256: ${data.currentHash.substring(0, 16)}...\nPDF: ${data.pdfLink}`);
                issueForm.reset();
            } else {
                alert("❌ Failed to issue certificate: " + (data.message || "Unknown error"));
            }
        } catch (error) {
            console.error("API Error:", error);
            alert("❌ Error connecting to Blockchain Ledger. Check console.");
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    });
}

// ==================== 2. PUBLIC VERIFICATION PORTAL ====================
const verifyForm = document.getElementById("verifyForm");
const resultBox = document.getElementById("verificationResult");

if (verifyForm) {
    verifyForm.addEventListener("submit", async function(e) {
        e.preventDefault();

        const certIdInput = document.getElementById("cert-id");
        const queryVal = certIdInput.value.trim();
        const submitBtn = document.getElementById("btnVerify") || verifyForm.querySelector("button[type='submit']");

        if (!queryVal) return;

        submitBtn.textContent = "⏳ Verifying Ledger...";
        submitBtn.disabled = true;

        try {
            const url = `${API_BASE_URL}?action=verify&query=${encodeURIComponent(queryVal)}&_t=${Date.now()}`;
            const response = await fetch(url, { redirect: "follow" });
            const data = await response.json();

            if (data.status === "SUCCESS" && data.record) {
                const rec = data.record;

                if (resultBox) {
                    resultBox.style.display = "block";

                    const badge = document.getElementById("verifyStatusBadge");
                    if (badge) {
                        if (data.isRevoked) {
                            badge.style.background = "#fffbeb";
                            badge.style.border = "1px solid #fde047";
                            badge.style.color = "#b45309";
                            badge.innerHTML = `⚠️ <b>CERTIFICATE REVOKED BY ISSUER</b><br>Reason: ${rec.revocationReason || "Administrative Revocation"}`;
                        } else if (data.isAuthentic) {
                            badge.style.background = "rgba(16, 185, 129, 0.1)";
                            badge.style.border = "1px solid #10b981";
                            badge.style.color = "#065f46";
                            badge.innerHTML = `✓ Blockchain Verified & Authentic Document (Block #${rec.blockIndex})`;
                        } else {
                            badge.style.background = "#fef2f2";
                            badge.style.border = "1px solid #ef4444";
                            badge.style.color = "#991b1b";
                            badge.innerHTML = `⚠️ <b>CRITICAL WARNING: Tampered Credential!</b>`;
                        }
                    }

                    const elName = document.getElementById("resStudentName");
                    const elEnroll = document.getElementById("resEnrollment");
                    const elCertId = document.getElementById("resCertId");
                    const elDept = document.getElementById("resDept");
                    const elEvent = document.getElementById("resCategory");
                    const elDate = document.getElementById("resIssueDate");
                    const elHash = document.getElementById("resBlockHash");
                    const btnPdf = document.getElementById("btnResViewPdf");

                    if (elName) elName.textContent = rec.studentName || "-";
                    if (elEnroll) elEnroll.textContent = rec.enrollmentNo || "-";
                    if (elCertId) elCertId.textContent = rec.certId || "-";
                    if (elDept) elDept.textContent = rec.courseDept || "-";
                    if (elEvent) elEvent.textContent = rec.eventTitle || "-";
                    if (elDate) elDate.textContent = rec.timestamp ? new Date(rec.timestamp).toLocaleDateString("en-IN", { dateStyle: "medium" }) : "-";
                    if (elHash) elHash.textContent = rec.currentHash || "-";

                    if (btnPdf) {
                        if (rec.pdfLink && rec.pdfLink.startsWith("http")) {
                            btnPdf.href = rec.pdfLink;
                            btnPdf.style.display = "inline-block";
                        } else {
                            btnPdf.style.display = "none";
                        }
                    }

                    const detailsGrid = document.getElementById("verifyDetailsGrid");
                    const metaRow = document.getElementById("blockchainMetaRow");
                    if (detailsGrid) detailsGrid.style.display = "grid";
                    if (metaRow) metaRow.style.display = "block";

                    resultBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
                } else {
                    alert(`Record Verified!\nCandidate: ${rec.studentName}\nID: ${rec.certId}\nAuthentic: ${data.isAuthentic ? "YES" : "TAMPERED"}`);
                }
            } else {
                alert("❌ No record found on ledger for ID: " + queryVal);
                if (resultBox) resultBox.style.display = "none";
            }
        } catch (error) {
            console.error("Verification Error:", error);
            alert("❌ Unable to verify document. Please check network connection.");
        } finally {
            submitBtn.textContent = "Verify Document";
            submitBtn.disabled = false;
        }
    });
}

// ==================== 3. BULK UPLOAD VIA CSV ====================
const csvInput = document.getElementById("csvFileInput");
const btnUploadCsv = document.getElementById("btnUploadCsv");
const btnSample = document.getElementById("btnDownloadSample");

// Sample CSV Download Helper
if (btnSample) {
    btnSample.addEventListener("click", () => {
        const sampleContent = "Student_Name,Enrollment_No,Dept,Event_Title,Cert_ID,DOB\n" +
            "Aryan Verma,01916403201,AIML,Academic Excellence,IPU-2026-AIML001,06012006\n" +
            "Sneha Gupta,01916403202,AIML,Institutional Event / Participation,IPU-2026-AIML002,01012006\n" +
            "Kunal Singh,01916403203,CSE,Degree / Program Completion,IPU-2026-AIML003,02012006";
        const blob = new Blob([sampleContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "Sample_Batch_Students.csv";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
}

// Parse & Post Batch Data
if (btnUploadCsv && csvInput) {
    btnUploadCsv.addEventListener("click", async function() {
        const file = csvInput.files[0];
        if (!file) {
            alert("Please select a CSV file first.");
            return;
        }

        const selectedBatchTemplate = document.getElementById("batch-cert-template") 
            ? document.getElementById("batch-cert-template").value 
            : "template_1";

        btnUploadCsv.textContent = "⏳ Mining Blocks...";
        btnUploadCsv.disabled = true;

        const reader = new FileReader();
        reader.onload = async function(e) {
            const text = e.target.result;
            const lines = text.split(/\r?\n/).filter(row => row.trim() !== "");
            
            if (lines.length <= 1) {
                alert("CSV is empty or missing data rows.");
                btnUploadCsv.textContent = "Process & Issue Batch";
                btnUploadCsv.disabled = false;
                return;
            }

            const batchData = [];
            for (let i = 1; i < lines.length; i++) {
                const cols = lines[i].split(",").map(c => c.trim());
                if (cols.length >= 4 && cols[0]) {
                    batchData.push({
                        studentName: cols[0],
                        enrollmentNo: cols[1] || "",
                        courseDept: cols[2] || "AIML",
                        eventTitle: cols[3] || "Academic Excellence",
                        certId: cols[4] || "",
                        dob: cols[5] || "",
                        template: selectedBatchTemplate
                    });
                }
            }

            try {
                const res = await fetch(API_BASE_URL, {
                    method: "POST",
                    body: JSON.stringify(batchData)
                });
                const resData = await res.json();

                if (resData.status === "SUCCESS") {
                    alert(`✅ Batch Mined Successfully!\n\nTotal Certificates: ${resData.count}\nAll records are anchored to the blockchain ledger.`);
                    csvInput.value = "";
                } else {
                    alert("❌ Bulk generation error: " + (resData.message || "Failed"));
                }
            } catch (err) {
                console.error("Bulk Upload Error:", err);
                alert("❌ Error connecting to Blockchain Ledger.");
            } finally {
                btnUploadCsv.textContent = "Process & Issue Batch";
                btnUploadCsv.disabled = false;
            }
        };

        reader.readAsText(file);
    });
}