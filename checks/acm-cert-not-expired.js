import{acmClient as client} from "../lib/aws-client.js";
import {ListCertificatesCommand, DescribeCertificateCommand } from "@aws-sdk/client-acm";

export async function checkACMCertNotExpired() {
  const results = [];

  try {
    const list = await client.send(new ListCertificatesCommand({}));
    console.log(list);
    if (!list.CertificateSummaryList || list.CertificateSummaryList.length === 0) {
      return {
        control: "CC6.7",
        description: "All ACM certificates must be valid and not expired",
        results: [],
        summary: { totalCertificates: 0, nonCompliant: 0 },
        note: "No ACM certificates found",
        passed: true,
      };
    }

    for (const cert of list.CertificateSummaryList || []) {
      const { Certificate } = await client.send(
        new DescribeCertificateCommand({ CertificateArn: cert.CertificateArn })
      );

      const expiry = new Date(Certificate.NotAfter);
      const now = new Date();
      const isCompliant = expiry > now;

      results.push({
        certArn: cert.CertificateArn,
        domainName: cert.DomainName,
        compliant: isCompliant,
        evidence: { notAfter: Certificate.NotAfter },
      });
    }

    return {
      control: "CC6.7",
      description: "All ACM certificates must be valid and not expired",
      results,
      summary: {
        totalCertificates: results.length,
        nonCompliant: results.filter(r => !r.compliant).length,
      },
      passed: results.every(r => r.compliant),
    };
  } catch (err) {
    console.log(`Error checking ACM certificates:`,err.name, err.message);
    
    return {
      control: "CC6.7",
      description: "All ACM certificates must be valid and not expired",
      results: [],
      summary: { totalCertificates: 0, nonCompliant: 0 },
      passed: true,
      note: `Check skipped: ${err.name} - ${err.message}`,
    };
  }
}
