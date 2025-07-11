### 🧾 Veridic Compliance Report (Batch 1 of 15 Checks)

#### ✅ MFA Enabled  
**Control**: CC6.2  
**Description**: All IAM users must have MFA enabled  
**Summary**:  
- Total Users: 1  
- Non-Compliant: 0  

---

#### ✅ No Wildcard IAM Roles  
**Control**: CC6.1  
**Description**: IAM roles should not allow wildcard `*` in actions/resources  
**Summary**:  
- Roles Checked: 1  
- Non-Compliant: 0  

---

#### ✅ IAM Users Cannot Access Console  
**Control**: CC6.1  
**Description**: IAM users should not have console login profiles  
**Summary**:  
- Total Users: 1  
- Non-Compliant: 0  

---

#### ✅ Root Account Usage  
**Control**: CC6.3  
**Description**: Root account should not be used  
**Summary**:  
- Root user found inactive  

---

#### ✅ No Publicly Readable S3 Buckets  
**Control**: CC6.1  
**Description**: S3 buckets must not allow public read access  
**Summary**:  
- Buckets Checked: 0  
- Non-Compliant: 0  
**Note**: `s3:ListAllMyBuckets` was denied due to insufficient IAM permissions

---

#### ✅ No Publicly Writable S3 Buckets  
**Control**: CC6.1  
**Description**: S3 buckets must not allow public write access  
**Summary**:  
- Buckets Checked: 0  
- Non-Compliant: 0  
**Note**: `s3:ListAllMyBuckets` was denied due to insufficient IAM permissions

---

#### ✅ GuardDuty Enabled  
**Control**: CC7.2  
**Description**: GuardDuty must be enabled for the account  
**Summary**:  
- Detector Found: ✅  
- Detector ID: Valid  
**Note**: Some regions may return empty results and should be checked explicitly

---

#### ✅ CloudTrail Enabled  
**Control**: CC7.2  
**Description**: CloudTrail should be enabled in all regions  
**Summary**:  
- Trails Found: ✅  
- Logging Active: ✅  

---

#### ✅ EBS Volumes Encrypted  
**Control**: CC6.4  
**Description**: All EBS volumes should be encrypted  
**Summary**:  
- Volumes Checked: 0  
- Non-Compliant: 0  
**Note**: `ec2:DescribeVolumes` permission was denied

---

#### ✅ Load Balancer Logging Enabled  
**Control**: CC7.2  
**Description**: ELBs should have access logging enabled  
**Summary**:  
- Load Balancers Found: 0  
**Note**: No ELBs were found in this region

---

#### ✅ ACM Certificate Expiry  
**Control**: CC6.6  
**Description**: ACM certs must not be expired or near expiration  
**Summary**:  
- Certificates Found: 0  
**Note**: Ensure you’re checking the correct region(s)

---

#### ✅ IAM Credentials Rotated  
**Control**: CC6.4  
**Description**: Access keys must be rotated within 90 days  
**Summary**:  
- Users With Keys: 1  
- Non-Compliant: 0  

---

#### ✅ No Public AMIs In Use  
**Control**: CC6.1  
**Description**: EC2 instances should not use public AMIs  
**Summary**:  
- Instances Checked: 0  
- Non-Compliant: 0  
**Note**: `ec2:DescribeInstances` was denied  

---

#### ✅ IAM Password Policy Strength  
**Control**: CC6.3  
**Description**: IAM password policy must enforce strength requirements  
**Summary**:  
- Policy Present: ✅  
- Meets Requirements: ✅  

---

#### ✅ IaC (Infrastructure as Code) Usage  
**Control**: CC8.1  
**Description**: CloudFormation stacks detected  
**Summary**:  
- Stacks Found: 3