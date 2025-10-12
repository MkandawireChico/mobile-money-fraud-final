# Developing an AI-Powered Fraud Detection System for Malawi's Mobile Money Ecosystem

## CHAPTER 1: INTRODUCTION

Mobile money is a digital financial service that allows users to store, send, and receive money using mobile phones, transforming financial inclusion in developing countries (GSMA, 2023). In Malawi, mobile money operates through platforms like TNM Mpamba and Airtel Money, where users can register accounts, deposit cash through agents, transfer money to other users, pay bills, and withdraw cash through a network of authorized agents (Reserve Bank of Malawi, 2017). The system facilitates both cash-based transactions through agents and digital transfers via USSD codes or mobile applications.

However, the growth of mobile money has introduced significant security challenges, particularly fraud, which threatens user trust and system sustainability (MACRA, 2024). Current fraud detection methods in Malawi's mobile money ecosystem rely primarily on rule-based systems that flag transactions exceeding predetermined thresholds, manual monitoring by operators, and reactive investigation of reported incidents (Reserve Bank of Malawi, 2023). These traditional approaches suffer from high false positive rates, delayed detection, and inability to adapt to evolving fraud patterns, creating a critical need for more sophisticated detection mechanisms.

### 1.1 Background

In Malawi, mobile money has become essential for financial inclusion, particularly in rural areas where traditional banking infrastructure is limited (Reserve Bank of Malawi, 2019). Platforms like TNM Mpamba and Airtel Money serve over 8 million active users, processing transactions worth more than MWK 2.8 trillion annually (MACRA, 2023). These services enable money transfers, utility bill payments, and merchant transactions, making financial services accessible to previously unbanked populations.

Mobile money supports economic growth by facilitating digital commerce, enabling small businesses to participate in the formal economy, and providing a foundation for financial inclusion initiatives (World Bank, 2021). However, the increasing sophistication of fraudulent activities poses significant threats to this ecosystem, with annual fraud losses estimated at MWK 500 million, eroding user confidence and potentially reversing financial inclusion gains (Reserve Bank of Malawi, 2023).

### 1.2 Problem Statement

In the context of Malawi's mobile money ecosystem, fraud refers to any illegal or deceptive act aimed at stealing money, personal information, or services from users through unauthorized access to accounts, identity theft, phishing attacks, agent collusion, or manipulation of transaction processes (Reserve Bank of Malawi, 2023). Current fraud detection systems used by mobile money operators in Malawi have significant weaknesses that reduce their ability to protect users from these fraudulent activities and maintain trust in the system.

These systems rely heavily on rule-based methods, which often flag 60-70% of transactions as suspicious, even when they are legitimate (Chukwuemeka & Okafor, 2021). This high rate of false alerts overwhelms investigation teams and delays responses to actual fraud cases. Additionally, these systems operate in batch mode rather than real-time, causing detection delays ranging from hours to days, allowing criminals to complete their schemes before being caught (Smith, 2020). The rigid transaction thresholds fail to consider contextual factors like cultural events, holidays, or legitimate changes in user behavior, leading to unnecessary blocks on legitimate transactions (MACRA, 2024).

These weaknesses result in annual fraud losses of millions of Malawian Kwacha, eroding public trust and threatening digital financial inclusion growth. Therefore, there is an urgent need to develop an advanced AI-powered fraud detection system that can overcome these limitations through real-time processing, intelligent pattern recognition, and adaptive learning capabilities.

### 1.3 Aim and Objectives

**Aim:** To develop an artificial intelligence-powered fraud detection system for mobile money transactions in Malawi.

**Objectives:**
1. Analyze requirements for an AI-powered fraud detection system through stakeholder analysis and system specification
2. Design a machine learning-based fraud detection architecture tailored for Malawi's mobile money ecosystem
3. Develop and implement the fraud detection system using appropriate software development methodologies
4. Test and evaluate the system's performance against existing fraud detection approaches
5. Validate the system through comprehensive testing and performance assessment

### 1.4 Significance

The AI-powered fraud detection system will enhance financial security for over 8 million mobile money users in Malawi, ensuring trust in platforms like TNM Mpamba and Airtel Money (MACRA, 2024). For mobile money operators, the system will reduce fraud losses, currently at MWK 500 million annually, and improve operational efficiency (World Bank, 2022). The system's impact extends to advancing AI applications in developing economies, potentially serving as a model for other African countries in improving financial security and supporting digital financial services critical for economic development.

### 1.5 Conclusion

This project addresses critical weaknesses in current fraud detection methods through advanced machine learning, offering real-time threat detection and efficient investigation tools. The system will protect mobile money users, reduce costs for operators, and support the growth of digital financial services in Malawi while providing insights into AI applications in financial technology for developing economies.

---

## CHAPTER 2: LITERATURE REVIEW

### 2.1 Introduction

Mobile money has reshaped financial services in sub-Saharan Africa, with nearly 50% of global users and over 781 million accounts by 2023 (GSMA, 2023). In Malawi, platforms like TNM Mpamba and Airtel Money handle over MWK 2.8 trillion yearly, serving more than 8 million users (Reserve Bank of Malawi, 2023). However, the growth of mobile money has brought more advanced fraud schemes that exploit system weaknesses and user behavior (MACRA, 2024).

Traditional rule-based fraud detection systems struggle with complex fraud patterns, produce many false alerts, delay detection, and require manual updates to address new fraud tactics (Smith, 2020). Machine learning provides a better solution by analyzing large transaction datasets, spotting complex fraud patterns, and adapting to new threats through continuous learning (Kumar, 2022).

### 2.2 Key Concepts

#### 2.2.1 Mobile Money Fraud

Mobile money fraud involves illegal activities that exploit weaknesses in mobile financial services, user behavior, or system processes to steal money or sensitive data (Reserve Bank of Malawi, 2023). These activities include identity theft, phishing for user credentials, agent impersonation, account takeovers, transaction interception, and coordinated attacks using multiple compromised accounts (Smith, 2020).

#### 2.2.2 Anomaly Detection

Anomaly detection identifies fraud by spotting unusual patterns in transaction data that differ from a user's normal behavior (Kabwe & Muteba, 2022). In mobile money systems, anomalies might include unusually large transactions, frequent transactions in short periods, transactions from unfamiliar locations, or activities at unusual times. Behavioral anomaly detection creates unique profiles of each user's normal transaction patterns, enabling detection of deviations that may signal fraud while recognizing natural variations in legitimate behavior (HighRadius, 2024).

#### 2.2.3 Machine Learning in Fraud Detection

Machine learning helps detect fraud by learning complex patterns from historical transaction data and adapting to new fraud tactics without manual rule changes (Azamuke et al., 2024). Supervised learning uses labeled examples of legitimate and fraudulent transactions to classify new ones, while unsupervised learning finds unusual patterns without requiring large amounts of labeled data (Monamo et al., 2016). The strength of machine learning lies in its adaptability, as models can be retrained with new data to spot emerging fraud patterns (Odufisan et al., 2025).

### 2.3 Review of Similar Systems

#### 2.3.1 M-Pesa Fraud Detection Systems in Kenya

M-Pesa uses a layered security system with real-time transaction monitoring and agent behavior scoring to detect suspicious activities (Mwangi et al., 2021). The system employs advanced anomaly detection to flag unusual patterns in transaction amounts, frequency, locations, or timing. However, M-Pesa struggles with false alerts during events like holidays or emergencies when user behavior changes naturally (Kamau, 2023).

#### 2.3.2 Airtel Money's Risk Scoring Models

Airtel Africa uses real-time transaction scoring systems combining rule-based methods with behavioral analysis (Odufisan et al., 2025). The system examines transaction details and user behavior to create risk scores, using machine learning to adjust thresholds based on fraud patterns. Device fingerprinting identifies suspicious device patterns, detecting account takeovers when combined with behavioral analysis (Mwangi et al., 2021).

#### 2.3.3 MTN MoMo's AI-Powered Detection System

MTN Mobile Money uses AI-powered fraud detection with machine learning algorithms to identify transaction anomalies in real-time (Awoyemi et al., 2020). It analyzes social network connections to detect potential collusion between agents and customers, combining multiple machine learning models for comprehensive fraud coverage (Monamo et al., 2016).

### 2.4 Critical Analysis and Research Gap

Current fraud detection systems have major flaws including rigid rule-based approaches that cannot adapt to new fraud tactics, lack of advanced user-specific behavioral analysis, and absence of contextual awareness for legitimate behavior changes (Smith, 2020). Most systems are not tailored to specific regional contexts, ignoring local fraud types, economic conditions, and cultural factors (Reserve Bank of Malawi, 2023).

The main research gap is the absence of a fraud detection system designed specifically for Malawi's mobile money environment, incorporating the country's unique social, economic, and behavioral factors. This research fills this gap by developing an AI-driven fraud detection system customized for Malawi using behavioral profiling, local fraud knowledge, and adaptive machine learning (Azamuke et al., 2024).

---

## CHAPTER 3: METHODOLOGY

### 3.1 System Development

The system development process uses Rapid Application Development (RAD) to design, build, and test an AI-powered fraud detection system tailored for Malawi's mobile money ecosystem (Jones & Patel, 2022). RAD enables fast prototyping, iterative testing, and stakeholder feedback to ensure the system is effective, scalable, and meets local operational needs.

#### 3.1.1 Research Approach

This study employs a Design Science Research approach, which is appropriate for developing innovative IT artifacts that solve identified problems (Hevner et al., 2004). Design science research focuses on creating and evaluating artifacts designed to solve organizational problems, making it suitable for developing a fraud detection system that addresses practical challenges in Malawi's mobile money ecosystem.

#### 3.1.2 Participants Selection

##### 3.1.2.1 Population and Participants

The study targeted key stakeholders in Malawi's mobile money ecosystem to understand system requirements and fraud detection needs. The population included mobile money users (individuals who conduct transactions), mobile money agents (service points facilitating cash-in/out operations), and fraud analysts (professionals responsible for investigating suspicious activities). Due to privacy restrictions and limited access to operational mobile money systems, direct engagement with these stakeholders was not feasible. Instead, the study relied on publicly available documentation, case studies, and technical resources to understand stakeholder needs and system requirements.

##### 3.1.2.2 Selection Technique

Purposive sampling is a non-probability sampling technique where researchers deliberately select participants or sources based on specific characteristics relevant to the research objectives (Creswell, 2018). This approach was appropriate for this study because it allowed for targeted selection of information sources that could provide insights into mobile money fraud detection requirements. Given the specialized nature of fraud detection systems and the need for technical understanding of mobile money operations, purposive sampling enabled the identification of high-quality, relevant documentation and case studies.

##### 3.1.2.3 Sample Size

The sample consisted of documented sources rather than human participants, due to access limitations. Ten key documents were purposively selected to represent different aspects of mobile money fraud detection: four user-focused security reports from mobile money operators, two agent operational manuals, and four technical fraud prevention frameworks. The sample size was determined by the principle of information saturation, where additional documents did not provide new insights relevant to the system requirements analysis (Braun & Clarke, 2006).

#### 3.1.3 Data Collection

Data collection involved two primary methods: requirements gathering through document analysis and machine learning dataset preparation. For requirements gathering, document analysis was employed to extract functional and non-functional requirements from regulatory guidelines, technical specifications, and fraud prevention frameworks (Bowen, 2009). Key sources included the Reserve Bank of Malawi Guidelines on Mobile Money Services (2022), mobile money operator security policies, and international fraud detection standards.

For machine learning model development, synthetic transaction data was generated to simulate realistic mobile money transaction patterns while addressing privacy and access limitations. The synthetic dataset included transaction attributes such as amount, timestamp, location, transaction type, user demographics, and fraud indicators, designed to replicate the statistical properties of real mobile money transactions in Malawi's context.

#### 3.1.4 Data Analysis

Data analysis was conducted using thematic analysis for requirements data and statistical analysis for machine learning datasets (Braun & Clarke, 2006). For requirements analysis, collected documents were systematically coded to identify recurring themes related to fraud patterns, system vulnerabilities, and stakeholder needs. These themes were categorized into functional requirements, non-functional requirements, and constraints.

For machine learning data analysis, synthetic transaction datasets underwent exploratory data analysis to understand data distributions, identify patterns, and detect anomalies. Statistical techniques including correlation analysis, distribution analysis, and anomaly detection were applied to prepare the data for machine learning model training and validation.

### 3.2 Machine Learning

#### 3.2.1 Research Strategy

The research employs an Applied Research Strategy, which is most appropriate for this study because it focuses on solving practical problems through the development of working solutions rather than purely theoretical exploration (Creswell, 2018). Applied research is particularly suitable for fraud detection system development as it emphasizes real-world applicability, measurable outcomes, and immediate practical value for mobile money operators in Malawi.

#### 3.2.2 ML Paradigm

Unsupervised learning was selected as the primary machine learning paradigm for this fraud detection system. This paradigm is particularly appropriate for fraud detection in mobile money environments where labeled fraud data is scarce and fraud patterns evolve continuously (Awoyemi et al., 2020). The study employs multiple anomaly detection algorithms to ensure comprehensive fraud coverage:

1. **Isolation Forest**: An ensemble method that isolates anomalies by randomly selecting features and split values (Liu et al., 2008)
2. **One-Class SVM**: A support vector machine approach for novelty detection that learns a decision function for outlier detection (Schölkopf et al., 2001)
3. **Local Outlier Factor (LOF)**: A density-based algorithm that identifies local outliers by comparing local density of data points (Breunig et al., 2000)
4. **Elliptic Envelope**: Assumes data follows a Gaussian distribution and identifies outliers based on Mahalanobis distance (Rousseeuw & Driessen, 1999)

This multi-algorithm approach enables the system to adapt to changing fraud patterns and detect previously unknown fraud types, essential for maintaining effectiveness in dynamic mobile money environments.

#### 3.2.3 Data Collection

Due to privacy restrictions and limited access to operational mobile money transaction data from TNM and Airtel Money, this study utilized synthetic datasets that simulate realistic mobile money transaction patterns. The synthetic dataset was generated to replicate the statistical properties and behavioral patterns typical of Malawi's mobile money ecosystem, including transaction amounts, frequencies, temporal patterns, and geographic distributions.

The dataset comprises 100,000 synthetic transactions representing various transaction types common in Malawi (cash-in, cash-out, person-to-person transfers, bill payments, and airtime purchases). Transaction features include amount, timestamp, location, transaction type, user demographics, device information, and fraud indicators. The synthetic data generation process incorporated domain knowledge about Malawi's mobile money usage patterns, ensuring realistic representation of user behaviors, seasonal variations, and fraud scenarios relevant to the local context.

#### 3.2.4 Algorithm Selection

The selection of fraud detection algorithms was based on their demonstrated suitability for real-world mobile money environments and ability to meet strict performance criteria. Four unsupervised anomaly detection algorithms were evaluated: Isolation Forest, One-Class SVM, Local Outlier Factor, and Elliptic Envelope.

The evaluation was guided by operational criteria including the algorithm's ability to achieve low false-positive rates, processing speed under 100 milliseconds for real-time alerts, capacity to scale efficiently with increasing data volumes, and interpretability necessary for investigators to understand detection decisions (Chandola et al., 2009).

#### 3.2.5 Implementation

The system was developed using Python 3.9 as the primary programming language for machine learning models and system logic. Key frameworks included Scikit-learn 1.3 for anomaly detection algorithms, Pandas 2.0 and NumPy 1.24 for data handling, and Matplotlib and Seaborn for data visualization. For production deployment, FastAPI was used to build RESTful API services, Docker for containerization, and Redis for caching to reduce system latency for real-time processing.

---

## References

Awoyemi, J. O., Adetunmbi, A. O., & Oluwadare, S. A. (2020). Credit card fraud detection using machine learning techniques: A comparative analysis. *Computer and Information Science*, 13(2), 1-12.

Azamuke, F., Kadobera, D., & Nakakawa, A. (2024). Machine learning approaches for fraud detection in mobile money systems: A systematic review. *Journal of Financial Technology*, 8(3), 45-62.

Bowen, G. A. (2009). Document analysis as a qualitative research method. *Qualitative Research Journal*, 9(2), 27-40.

Braun, V., & Clarke, V. (2006). Using thematic analysis in psychology. *Qualitative Research in Psychology*, 3(2), 77-101.

Breunig, M. M., Kriegel, H. P., Ng, R. T., & Sander, J. (2000). LOF: Identifying density-based local outliers. *ACM SIGMOD Record*, 29(2), 93-104.

Chandola, V., Banerjee, A., & Kumar, V. (2009). Anomaly detection: A survey. *ACM Computing Surveys*, 41(3), 1-58.

Chukwuemeka, O., & Okafor, C. (2021). Mobile money fraud detection challenges in sub-Saharan Africa. *African Journal of Financial Technology*, 5(2), 78-92.

Creswell, J. W. (2018). *Research design: Qualitative, quantitative, and mixed methods approaches* (5th ed.). Sage Publications.

GSMA. (2023). *State of the industry report on mobile money*. GSMA Association.

Hevner, A. R., March, S. T., Park, J., & Ram, S. (2004). Design science in information systems research. *MIS Quarterly*, 28(1), 75-105.

HighRadius. (2024). *Behavioral anomaly detection in financial services*. HighRadius Corporation.

Jones, M., & Patel, S. (2022). Rapid application development in financial technology systems. *Software Engineering Journal*, 15(4), 234-248.

Kabwe, M., & Muteba, K. (2022). Anomaly detection techniques for mobile financial services in Africa. *International Journal of Computer Applications*, 184(12), 15-22.

Kamau, J. (2023). Challenges in mobile money fraud detection: The M-Pesa experience. *East African Technology Review*, 7(1), 45-58.

Kumar, R. (2022). Machine learning applications in financial fraud detection. *IEEE Transactions on Systems*, 52(3), 1456-1467.

Kumar, S. (2024). Evolution of fraud techniques in digital financial services. *Cybersecurity and Financial Technology*, 3(2), 89-104.

Liu, F. T., Ting, K. M., & Zhou, Z. H. (2008). Isolation forest. *Proceedings of the 8th IEEE International Conference on Data Mining*, 413-422.

MACRA. (2024). *Mobile money security assessment report*. Malawi Communications Regulatory Authority.

Monamo, P., Marivate, V., & Twala, B. (2016). Unsupervised learning for robust Bitcoin fraud detection. *Information Security for South Africa*, 1-10.

Mwangi, P., Kiprotich, S., & Ochieng, D. (2021). Real-time fraud detection in mobile money systems: A Kenyan perspective. *African Journal of Information Systems*, 13(2), 156-172.

Odufisan, A., Adewole, K., & Ogunde, A. (2025). Advanced machine learning techniques for mobile money fraud detection in Nigeria. *Journal of Financial Crime Prevention*, 12(1), 23-38.

Onyango, M., Wambugu, G., & Macharia, J. (2020). Contextual fraud detection in East African mobile money platforms. *International Journal of Advanced Computer Science*, 11(4), 78-89.

Reserve Bank of Malawi. (2017). *Mobile money guidelines and regulations*. Reserve Bank of Malawi.

Reserve Bank of Malawi. (2019). *Financial inclusion strategy 2019-2024*. Reserve Bank of Malawi.

Reserve Bank of Malawi. (2023). *Annual report on mobile money operations*. Reserve Bank of Malawi.

Rousseeuw, P. J., & Driessen, K. V. (1999). A fast algorithm for the minimum covariance determinant estimator. *Technometrics*, 41(3), 212-223.

Schölkopf, B., Platt, J. C., Shawe-Taylor, J., Smola, A. J., & Williamson, R. C. (2001). Estimating the support of a high-dimensional distribution. *Neural Computation*, 13(7), 1443-1471.

Smith, A. (2020). Traditional vs. modern fraud detection systems: A comparative study. *Financial Security Review*, 8(3), 112-128.

World Bank. (2021). *Digital financial services and financial inclusion in Malawi*. World Bank Group.

World Bank. (2022). *Mobile money and economic development in sub-Saharan Africa*. World Bank Group.
