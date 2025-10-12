Developing an AI-Powered Fraud Detection System for Malawi's Mobile Money Ecosystem
CHAPTER 1: INTRODUCTION
Mobile money is a digital financial service that allows users to store, send, and receive money using mobile phones, transforming financial inclusion in developing countries (GSMA, 2023). In Malawi, mobile money operates through platforms like TNM Mpamba and Airtel Money, where users can register accounts, deposit cash through agents, transfer money to other users, pay bills, and withdraw cash (Reserve Bank of Malawi, 2017). The system works through a network of authorized agents who facilitate cash-in and cash-out transactions, while digital transfers occur through USSD codes or mobile applications. However, the growth of mobile money has introduced significant security challenges, particularly fraud, which threatens user trust and system sustainability (MACRA, 2024). Current fraud detection methods in Malawi's mobile money ecosystem rely primarily on rule-based systems that flag transactions exceeding predetermined thresholds, manual monitoring by operators, and reactive investigation of reported incidents (Reserve Bank of Malawi, 2023). These traditional approaches suffer from high false positive rates, delayed detection, and inability to adapt to evolving fraud patterns, creating a need for more sophisticated detection mechanisms.
1.1 Background
Mobile money is a cornerstone of financial services in Malawi, where traditional banking is often inaccessible, especially in rural areas (Reserve Bank of Malawi, 2019). Platforms like TNM Mpamba and Airtel Money serve over 8 million active users, processing transactions worth more than MWK 2.8 trillion each year (MACRA, 2023). These services enable people to transfer money, pay utility bills, and buy goods, making financial transactions simple and accessible. Mobile money supports financial inclusion by helping individuals, small businesses, and communities participate in the digital economy, contributing to Malawi’s economic growth (World Bank, 2021).
…..
The proposed AI-powered fraud detection system uses machine learning to monitor mobile money transactions in real time. It includes several components: a transaction processing engine to track activities instantly, machine learning tools to identify suspicious patterns, investigation tools to manage potential fraud cases, audit and reporting features to ensure transparency, and strong security measures to protect user information (Reserve Bank of Malawi, 2023). This system safeguards individual transactions and builds trust in Malawi’s mobile money ecosystem. A secure digital financial system is vital for encouraging more people to use mobile money, supporting financial inclusion, and driving economic development across the country.
1.2 Problem with the Current System
Current fraud detection systems used by mobile money operators in Malawi have significant weaknesses that reduce their ability to protect users and maintain trust in the system (Reserve Bank of Malawi, 2023). These systems rely heavily on rule-based methods, which often flag 60-70% of transactions as suspicious, even when they are legitimate (Chukwuemeka & Okafor, 2021). This high rate of false alerts overwhelms investigation teams, lowers efficiency, and delays responses to actual fraud cases. Additionally, these systems do not process transactions in real time, instead operating in batch mode. This causes delays in detecting fraud, ranging from hours to days, allowing criminals to complete their schemes and cause significant financial losses before being caught (Smith, 2020).
Another key issue is the rigid transaction thresholds in current systems. For example, if a user receives an amount beyond their usual limit, such as someone who typically receives MWK 40,000 monthly getting MWK 200,000, the system automatically flags it as fraud without considering context like cultural events, weekends, holidays, time of day, new locations, or new devices (MACRA, 2024). This leads to unnecessary blocks on legitimate transactions and frustrates users. Manual investigation processes are also slow and inconsistent, with each case review taking 25-30 minutes on average and lacking standardized procedures for thorough and reliable assessments (Garcia, 2019). Moreover, current systems struggle to adapt to new fraud techniques. They depend on manual updates to rules, which cannot keep up with the rapidly evolving tactics used by sophisticated criminal networks (Kumar, 2024). These weaknesses lead to annual fraud losses of millions of Malawian Kwacha, eroding public trust in mobile money services and threatening the growth of digital financial inclusion in Malawi. This project aims to develop an advanced AI-powered fraud detection system to overcome these challenges. The system will use real-time processing, machine learning to identify fraud patterns based on user transaction behavior, and improved investigation tools to enhance efficiency and accuracy (Reserve Bank of Malawi, 2023).
1.3 Aim and Objectives
Aim
To develop an artificial intelligence-powered fraud detection system for mobile money transactions in Malawi.
Objectives
i.	Analyze requirements for an AI-powered fraud detection system through stakeholder analysis and system specification.
ii.	Design a machine learning-based fraud detection architecture tailored for Malawi's mobile money ecosystem.
iii.	Develop and implement the fraud detection system using appropriate software development methodologies.
iv.	Test and evaluate the system's performance against existing fraud detection approaches.
v.	Validate the system through comprehensive testing and performance assessment.
1.4 Significance
The AI-powered fraud detection system for Malawi’s mobile money ecosystem will bring significant value by enhancing financial security, supporting economic growth, and improving social well-being (Reserve Bank of Malawi, 2023). It will protect over 8 million mobile money users from financial losses, ensuring trust in platforms like TNM Mpamba and Airtel Money (MACRA, 2024). This trust encourages continued use of digital financial services, which are vital for financial inclusion. For mobile money operators, the system will reduce fraud losses, currently at MWK 500 million annually, and improve efficiency by automating detection and streamlining investigations, cutting staffing and operational costs (World Bank, 2022).
Without this system, persistent fraud could erode public confidence, leading to lower mobile money adoption and fewer transactions (Chukwuemeka & Okafor, 2021). This could trigger stricter regulations, limiting mobile money operations and slowing progress toward financial inclusion and economic growth. Unbanked and underbanked communities, who rely on these services as alternatives to traditional banking, would face greater financial risks and exclusion, deepening poverty and inequality.
The system’s impact extends to advancing technology in developing economies. By using machine learning to tackle fraud, it shows how AI can solve real-world challenges in African financial markets (Smith, 2020). A successful system could serve as a model for other countries, improving financial security across the region and supporting digital financial services critical for economic development and poverty reduction.
1.5 Conclusion
The system uses advanced machine learning to address the weaknesses of current fraud detection methods, offering real-time threat detection, efficient investigation tools, and support for regulatory compliance. Completing this project will deliver a ready-to-use fraud detection system that protects mobile money users, reduces costs for mobile operators, and supports the growth of digital financial services in Malawi. It also provides insights into using AI for financial technology in developing economies.
This report is organized into seven chapters. Chapter 2 reviews existing fraud detection methods and identifies gaps that guide this project. Chapter 3 explains the research and system development methods. Chapter 4 analyzes stakeholder needs and defines technical requirements. Chapter 5 details the system’s design, including its structure, interfaces, and algorithms. Chapter 6 covers the implementation, testing, and validation processes. Chapter 7 evaluates the project’s outcomes, discusses limitations, and suggests future research directions.



Chapter 2: Literature Review
This chapter lays the groundwork for the study by exploring existing research and systems related to mobile money fraud detection. It explains key terms, reviews current technologies, examines similar systems, and highlights gaps that the proposed AI-powered fraud detection system will address in Malawi’s mobile money ecosystem.
2.1 Introduction
Mobile money has reshaped financial services in sub-Saharan Africa, with nearly 50% of global users and over 781 million accounts by 2023 (GSMA, 2023). In Malawi, platforms like TNM Mpamba and Airtel Money handle over MWK 2.8 trillion yearly, serving more than 8 million users for transactions like money transfers, bill payments, and purchases (Reserve Bank of Malawi, 2023). These services greatly improve financial inclusion for unbanked communities.
However, the growth of mobile money has brought more advanced fraud schemes that exploit system weaknesses and user behavior (MACRA, 2024). Traditional rule-based fraud detection systems are simple but flawed. They struggle to detect complex fraud, produce many false alerts, delay detection, and require manual updates to address new fraud tactics (Smith, 2020).
Machine learning provides a better solution by analyzing large transaction datasets, spotting complex fraud patterns, and adapting to new threats through continuous learning (Kumar, 2022). This improves detection accuracy and reduces false alerts, easing the burden on investigation teams and protecting legitimate users.
Current systems often fail to consider the unique social, economic, and behavioral traits of mobile money users in regions like Malawi. This research aims to address this gap by developing an AI-based fraud detection system tailored to Malawi’s mobile money ecosystem, focusing on local user behaviors and fraud patterns.


2.2 Key Concepts 
This section lays the groundwork for understanding mobile money fraud detection by explaining key concepts and principles needed to build effective fraud detection systems.
2.2.1 Mobile Money Fraud
Mobile money fraud involves illegal activities that exploit weaknesses in mobile financial services, user behavior, or system processes to steal money or sensitive data (Reserve Bank of Malawi, 2023). These activities include tactics like identity theft through trickery, phishing for user credentials, pretending to be legitimate agents, misusing inactive accounts, intercepting transactions, or coordinating attacks using multiple hacked accounts.
Fraudsters use advanced methods that imitate normal user actions, making them hard to detect with traditional rule-based systems (Smith, 2020). These systems rely on fixed rules and thresholds, which struggle to identify complex fraud patterns. This research views fraud as deviations from a user’s typical transaction patterns. Each user has unique habits based on their financial needs, location, and economic situation. Analyzing these personal patterns is more effective for detecting fraud than using general rules.
2.2.2 Anomaly Detection
Anomaly detection is a key method for identifying fraud by spotting unusual patterns in transaction data that differ from a user’s normal behavior. In mobile money systems, anomalies might include unusually large transactions, frequent transactions in a short time, transactions from unfamiliar locations, or activities at odd times compared to a user’s typical routine (Kabwe & Muteba, 2022). Behavioral anomaly detection works by creating a unique profile of each user’s normal transaction patterns. This allows the system to detect deviations that may signal fraud while recognizing natural variations in legitimate behavior. Unlike fixed rules, this method adapts to each user’s specific habits, making it more effective (HighRadius, 2024). 
To work well in mobile money systems, anomaly detection must account for legitimate changes in behavior, such as those caused by seasonal events, economic shifts, emergencies, or personal circumstances. The system needs to distinguish between suspicious activities that require investigation and normal changes in a user’s behavior (HighRadius, 2024).
2.2.3 Machine Learning in Fraud Detection
Machine learning helps detect fraud by learning complex patterns from past transaction data and adapting to new fraud tactics without needing manual rule changes (Azamuke et al., 2024). It finds subtle patterns in large datasets that human analysts or traditional rule-based systems might miss.
Supervised learning is useful for fraud detection. It uses labeled examples of legitimate and fraudulent transactions to classify new ones, identifying complex patterns and relationships that indicate fraud while adapting to new fraud types (Awoyemi et al., 2020).
Unsupervised learning is valuable in mobile money fraud detection because it finds unusual patterns without needing large amounts of labeled data, which is often limited (Monamo et al., 2016). It can detect new fraud tactics that were previously unknown or undocumented.
The strength of machine learning lies in its adaptability. Models can be retrained with new data to spot emerging fraud patterns, keeping the system effective against evolving threats and maintaining high detection accuracy over time (Odufisan et al., 2025).
2.3 Review of Similar Systems
This section reviews fraud detection systems used by major mobile money operators and key academic research efforts. It draws practical lessons, highlights implementation challenges, and points out limitations, especially for Malawi's mobile money environment.
2.3.1 M-Pesa Fraud Detection Systems in Kenya
M-Pesa, run by Safaricom in Kenya, uses a layered security system to detect fraud. It monitors transactions in real time and scores agent behavior to spot suspicious activities (Mwangi et al., 2021). The system uses advanced anomaly detection to flag unusual patterns in transaction amounts, frequency, locations, or timing, creating risk scores for transactions and accounts.
However, M-Pesa struggles with false alerts during events like holidays, government cash transfers, or emergencies, when user behavior changes naturally (Kamau, 2023). These false alerts burden investigation teams and may delay or block legitimate transactions. This shows the need for systems that adapt to context and legitimate behavior changes while staying sensitive to fraud (Onyango et al., 2020).

2.3.2 Airtel Money's Risk Scoring Models
Airtel Africa uses advanced real-time transaction scoring systems that combine rule-based methods with behavioral analysis to evaluate fraud risk (Odufisan et al., 2025). The system examines transaction details and user behavior to create detailed risk scores. It uses machine learning to adjust thresholds based on fraud patterns and system performance, improving detection accuracy and reducing false alerts that affect investigation teams and legitimate users (Mwangi et al., 2021). Device fingerprinting identifies suspicious device patterns, detecting account takeovers or device-based fraud, strengthening protection when combined with behavioral analysis.
Weaknesses: Airtel’s system can be complex to implement and maintain, requiring significant computational resources and technical expertise, which may be limited in Malawi (Kamau, 2023). It may also struggle to fully adapt to unique local fraud patterns, such as those tied to cultural or seasonal transactions, leading to potential false positives or missed fraud cases in resource-constrained settings (Onyango et al., 2020).

2.3.3 MTN MoMo's AI-Powered Detection System
MTN Mobile Money (MoMo) uses advanced AI-powered fraud detection with machine learning algorithms to identify transaction anomalies in real time (Awoyemi et al., 2020). It also analyzes social network connections to detect potential collusion between agents and customers (Monamo et al., 2016). The system combines multiple machine learning models to achieve strong detection across various fraud types and attack methods. It examines transaction patterns, user behaviors, relationships, and contextual factors to create thorough fraud risk assessments.
Social network analysis helps identify coordinated fraud, such as agent collusion or organized fraud networks, which may not be caught by analyzing individual transactions alone (Azamuke et al., 2024). This approach provides insights into complex fraud operations involving multiple actors. The system’s success depends on high-quality labeled data, strong data management, and significant computing resources to support real-time processing and model training (Odufisan et al., 2025).

2.3.4 Academic Prototypes and Research Models
Academic research has developed various prototype fraud detection systems for mobile money. Some combine decision tree algorithms with anomaly detection to merge the clarity of rule-based systems with machine learning’s ability to recognize patterns (Awoyemi et al., 2020). These hybrid models show strong detection performance. Other studies use ensemble methods, combining multiple algorithms to achieve better results than single approaches (Monamo et al., 2016).

Research also explores deep learning, graph neural networks, and advanced feature engineering for fraud detection, showing promising results in controlled settings (Azamuke et al., 2024). However, these models face challenges in real-world use due to scalability issues, high computational needs, and reliance on simulated or incomplete datasets that may not reflect actual mobile money environments (Odufisan et al., 2025). These studies provide valuable ideas but highlight the difficulty of turning research prototypes into practical, deployable systems for mobile money platforms.



2.3.5 Lessons for the Malawian Context
The review of these systems offers key lessons for developing fraud detection systems tailored to Malawi’s mobile money ecosystem. Systems must be aware of user behavior and local context, as general approaches often fail to account for diverse user patterns and economic conditions in Malawi (Onyango et al., 2020). Real-time detection is essential to prevent fraud quickly, requiring efficient system design, computational speed, and scalability (Mwangi et al., 2021).
Data privacy and security are critical due to the sensitive nature of financial data and strict regulatory requirements in financial services (Reserve Bank of Malawi, 2023). In Malawi, where computational resources, technical expertise, and funding may be limited, open-source, lightweight, and modular system designs are practical. These approaches enable cost-effective implementation while ensuring the system remains effective and can scale as needed (Kamau, 2023).
2.4 Critical Analysis and Research Gap
Current fraud detection systems have major flaws that reduce their effectiveness in mobile money platforms (Smith, 2020). Rule-based systems are rigid and cannot adapt to new fraud tactics, losing effectiveness as fraudsters develop methods to bypass fixed rules. These systems often flag too many legitimate transactions as suspicious, overwhelming investigation teams, while also missing actual fraudulent transactions.
Most systems lack advanced user-specific behavioral analysis, applying the same detection rules to all users despite differences in their financial habits, economic situations, or transaction patterns (Kumar, 2022). This one-size-fits-all approach fails to account for diverse user behaviors, leading to poor detection accuracy across various user groups.
Another key issue is the lack of contextual awareness. Current systems do not consider legitimate reasons for changes in user behavior, such as seasonal economic trends, emergencies, government programs, or personal circumstances that alter transaction patterns, resulting in false alerts or missed fraud (Onyango et al., 2020).
Many systems are not tailored to specific regional contexts, ignoring local fraud types, economic conditions, cultural factors, and regulatory rules that shape user behavior and fraud patterns (Reserve Bank of Malawi, 2023). This lack of localization makes them less effective in markets like Malawi with unique conditions.
The main research gap is the absence of a fraud detection system designed specifically for Malawi’s mobile money environment, incorporating the country’s unique social, economic, and behavioral factors, fraud patterns, and operational challenges. Systems effective in other contexts may not work well in Malawi without significant customization.
This research fills this gap by developing an AI-driven fraud detection system customized for Malawi. It uses behavioral profiling, local fraud knowledge, and adaptive machine learning to stay effective against evolving fraud while addressing the unique needs of Malawi’s mobile money ecosystem (Azamuke et al., 2024).2.5 Conclusion
The literature review reveals major weaknesses in current mobile money fraud detection systems. These systems use rigid rule-based methods, lack customization for local contexts, and do not apply advanced behavioral analysis to understand individual user patterns or legitimate behavior changes. This results in low detection accuracy, frequent false alerts, and failure to adapt to new fraud tactics threatening mobile money platforms.
Systems like M-Pesa, Airtel Money, and MTN MoMo show the potential of advanced fraud detection but face challenges in creating reliable, efficient systems. They highlight the need for continuous improvements to balance accuracy and operational efficiency.
Academic research suggests machine learning can enhance fraud detection but struggles to produce practical systems for real-world mobile money settings due to resource and operational limits.
The main research gap is the absence of a fraud detection system tailored to Malawi’s unique social and economic context. This gap provides an opportunity to improve fraud detection and support the growth of mobile money services in Malawi.
The proposed AI-powered fraud detection system tackles these issues by improving accuracy, reducing false alerts, and proactively preventing fraud. It uses advanced machine learning, behavioral profiling, and local knowledge to deliver effective fraud protection customized for Malawi’s mobile money ecosystem, ensuring its growth and trustworthiness.
The next chapter outlines the methodology for developing this system, detailing the research approach, system design process, and steps to implement and test the solution in Malawi’s context.












Chapter 3: Methodology
This chapter presents the methodology employed in developing the artificial intelligence-powered fraud detection system for Malawi's mobile money ecosystem. The methodology is divided into two main sections: system development approach and machine learning implementation strategy.
3.1 System Development
The system development process uses Rapid Application Development (RAD) to design, build, and test an AI-powered fraud detection system tailored for Malawi’s mobile money ecosystem. RAD enables fast prototyping, iterative testing, and stakeholder feedback to ensure the system is effective, scalable, and meets local operational needs.
3.1.1 Introduction
This section explains the methodology used to develop an AI-powered fraud detection system for mobile money transactions in Malawi. The project required a strong software application and a machine learning component to detect unusual transactions. The methodology included two linked phases: system development and machine learning. System development focused on gathering requirements, creating prototypes, and refining them with stakeholder feedback for a user-friendly application. The machine learning phase involved preparing datasets, selecting algorithms, and integrating trained models. Together, these phases created a practical solution addressing the study’s objectives.
3.1.2 Approach
This section describes the approach using Rapid Application Development (RAD) methodology with a focus on prototyping for fast progress (Jones & Patel, 2022). RAD was chosen to speed up system delivery and allow improvements based on user and stakeholder feedback, important due to changing fraud patterns in Malawi (Odufisan et al., 2025). This method helped move quickly from requirements to initial prototypes, enabling fraud officers, administrators, and others to test the system early. Feedback from these reviews improved the interface and functionality, leading to a cycle of prototyping, evaluation, and refinement until a stable system was ready (Mwangi et al., 2021). The benefits of RAD included active stakeholder involvement to tackle real fraud challenges, flexibility for adjustments based on new insights, and support for testing various machine learning algorithms to find the best ones. Multiple system versions were built, each enhancing design, processing, and machine learning integration. This step-by-step process delivered a user-centered system for real-time fraud detection in Malawi’s mobile money ecosystem. 
Diagram – RAD Model
3.1.3 Participants Selection
3.1.3.1 Population and Participants 
The study examined key stakeholders in Malawi’s mobile money ecosystem, including mobile money users, agents, and system administrators. Insights into their roles and interactions were gathered through observations of documented case studies, online document reviews, and tutorials on mobile money systems, informing the system’s design and evaluation.
3.1.3.2 Selection Technique 
Purposive sampling is a non-probability sampling technique where researchers deliberately select participants or sources based on specific characteristics relevant to the research objectives (Creswell, 2018). This approach was appropriate for this study because it allowed for targeted selection of information sources that could provide insights into mobile money fraud detection requirements. Given the specialized nature of fraud detection systems and the need for technical understanding of mobile money operations, purposive sampling enabled the identification of high-quality, relevant documentation and case studies that addressed the specific operational needs and technical requirements of different stakeholder roles in the mobile money ecosystem.
3.1.3.3 Sample Size 
The sample consisted of documented sources rather than human participants, due to access limitations. Ten key documents were purposively selected to represent different aspects of mobile money fraud detection: four user-focused security reports from mobile money operators, two agent operational manuals, and four technical fraud prevention frameworks. These documents were selected based on their relevance to fraud detection requirements, technical depth, and representation of different stakeholder perspectives. The sample size of ten documents was determined by the principle of information saturation, where additional documents did not provide new insights relevant to the system requirements analysis. This approach ensured comprehensive coverage of fraud detection needs across user, operational, and technical dimensions while working within the constraints of publicly available information.
3.1.3.4 Rationale for Selection 
Mobile money users’ transaction patterns and fraud-related challenges, derived from online reports and tutorials, informed user behavior analysis. Agents’ operational processes, observed through documented case studies, provided a foundation for realistic system design. Administrators’ technical and security considerations, sourced from online frameworks, ensured alignment with industry standards (Chilongo, 2023).
3.1.4 Data Collection 
Data collection for this study involved two primary methods: requirements gathering through document analysis and machine learning dataset preparation. For requirements gathering, document analysis was employed to extract functional and non-functional requirements from regulatory guidelines, technical specifications, and fraud prevention frameworks. Key sources included the Reserve Bank of Malawi Guidelines on Mobile Money Services (2022), mobile money operator security policies, and international fraud detection standards. This method was appropriate for understanding regulatory requirements, technical constraints, and industry best practices for fraud detection systems. For machine learning model development, synthetic transaction data was generated to simulate realistic mobile money transaction patterns while addressing privacy and access limitations. The synthetic dataset included transaction attributes such as amount, timestamp, location, transaction type, user demographics, and fraud indicators, designed to replicate the statistical properties of real mobile money transactions in Malawi's context.
3.1.5 Data Analysis 
Data analysis was conducted using thematic analysis for requirements data and statistical analysis for machine learning datasets. For requirements analysis, collected documents were systematically coded to identify recurring themes related to fraud patterns, system vulnerabilities, and stakeholder needs. These themes were then categorized into functional requirements (system capabilities), non-functional requirements (performance, security), and constraints (regulatory, technical). The analysis employed deductive coding based on established fraud detection frameworks and inductive coding to identify context-specific requirements for Malawi's mobile money environment. For machine learning data analysis, synthetic transaction datasets underwent exploratory data analysis to understand data distributions, identify patterns, and detect anomalies. Statistical techniques including correlation analysis, distribution analysis, and anomaly detection were applied to prepare the data for machine learning model training and validation.

3.2 Machine Learning
3.2.1 Introduction
The machine learning component of the system focuses on developing algorithms that are capable of identifying fraudulent mobile money transactions in real-time. The primary objective is to achieve high detection accuracy while maintaining minimal false-positive rates, which is crucial for ensuring operational effectiveness and a seamless user experience. The approach emphasizes unsupervised learning techniques, a strategy selected to address the practical challenge of limited labeled fraud data, a common issue in live mobile money ecosystems where confirmed fraud cases are a small fraction of the total transaction volume.
3.2.2 Research Strategy
The research employs an Applied Research Strategy, which is most appropriate for this study because it focuses on solving practical problems through the development of working solutions rather than purely theoretical exploration (Creswell, 2018). Applied research is particularly suitable for fraud detection system development as it emphasizes real-world applicability, measurable outcomes, and immediate practical value for mobile money operators in Malawi. This strategy enables the development of a functional system that addresses specific fraud detection challenges while contributing to the broader knowledge base of AI applications in financial technology. The applied research approach facilitates systematic experimentation with multiple machine learning algorithms to identify optimal solutions for Malawi's mobile money fraud detection context, ensuring both academic rigor and practical relevance.
3.2.3 ML Paradigm
Unsupervised learning was selected as the primary machine learning paradigm for this fraud detection system. This paradigm is particularly appropriate for fraud detection in mobile money environments where labeled fraud data is scarce and fraud patterns evolve continuously (Awoyemi et al., 2020). Unsupervised learning algorithms can identify anomalous patterns in transaction data without requiring extensive historical fraud examples, making them suitable for detecting novel fraud techniques. The study employs anomaly detection algorithms, specifically focusing on isolation-based methods that can efficiently identify outliers in high-dimensional transaction data. This approach enables the system to adapt to changing fraud patterns and detect previously unknown fraud types, which is essential for maintaining effectiveness in dynamic mobile money environments.
3.2.4 Data Collection
Due to privacy restrictions and limited access to operational mobile money transaction data from TNM and Airtel Money, this study utilized synthetic datasets that simulate realistic mobile money transaction patterns. The synthetic dataset was generated to replicate the statistical properties and behavioral patterns typical of Malawi's mobile money ecosystem, including transaction amounts, frequencies, temporal patterns, and geographic distributions. The dataset comprises 100,000 synthetic transactions representing various transaction types common in Malawi (cash-in, cash-out, person-to-person transfers, bill payments, and airtime purchases). Transaction features include amount, timestamp, location, transaction type, user demographics, device information, and fraud indicators. The synthetic data generation process incorporated domain knowledge about Malawi's mobile money usage patterns, ensuring realistic representation of user behaviors, seasonal variations, and fraud scenarios relevant to the local context.
3.2.5 Data Preprocessing
Before the data can be used to train the machine learning models, a rigorous preprocessing pipeline is applied to ensure data quality and consistency. Missing Data Handling is a critical first step. For numerical features with less than 5% missing values, mean imputation is used. Conversely, records with more than 20% missing critical features are entirely excluded to prevent the introduction of bias. Indicator variables are created for features with systematic missingness patterns to allow the model to learn from the absence of data. Feature Selection is then performed to improve model performance and reduce computational load. This includes correlation analysis, which removes highly correlated features (with a correlation value greater than 0.95) to reduce multicollinearity, and variance filtering, which eliminates low-variance features that provide minimal discriminative information to the model. Features are also selected based on domain expertise and stakeholder input to ensure their relevance to fraud detection. Data is then prepared for the algorithms through Normalization. Z-score normalization is applied to numerical features to ensure they have a consistent scale, which is crucial for distance-based algorithms. Categorical encoding is used to convert non-numerical data into a format that the machine learning models can understand. This involves one-hot encoding for categorical variables with fewer than 10 unique categories and label encoding for features with high cardinality. Finally, Outlier Treatment is performed to handle extreme values that could skew model performance. Outliers are identified using statistical methods such as the interquartile range and z-score methods. These identified outliers are then verified with domain experts to distinguish between data errors and legitimate extreme values that must be retained for accurate fraud detection.
3.2.6 Algorithm Selection
The selection of the primary fraud detection algorithm was based on its demonstrated suitability for real-world mobile money environments and ability to meet strict performance criteria. Four unsupervised anomaly detection algorithms were evaluated against a set of key metrics: Elliptic Envelope, One-Class SVM, Local Outlier Factor, and Isolation Forest.
The Elliptic Envelope algorithm was ultimately chosen for the core implementation, as its assumption of data following a Gaussian distribution provided the most robust baseline for identifying anomalies within the synthetic transaction data. This choice was validated by achieving the highest Composite Score in the preliminary evaluation.
This selection was guided by a set of clear operational criteria: the algorithm’s ability to achieve a low false-positive rate, a processing speed of under 100 milliseconds for real-time alerts, a capacity to scale efficiently with increasing data volumes, and a degree of interpretability necessary for investigators to understand the detection decisions.
3.2.7 Implementation
The system was developed within a reliable and modern programming environment to ensure stability and easy growth (scalability). Python 3.9 was chosen as the main programming language for the machine learning model and system logic, with Jupyter Notebooks used for initial testing and algorithm experiments, and Visual Studio Code (VS Code) serving as the main tool for crafting production-ready code. The machine learning implementation relied on key frameworks: Scikit-learn 1.3 for the primary anomaly detection algorithm, Pandas 2.0 and NumPy 1.24 for all data handling and numerical calculations, and Matplotlib and Seaborn for data visualization and analysis of algorithm performance. For production and deployment, a modular stack was used: FastAPI built the RESTful API service to receive data and return fraud predictions quickly, Docker was essential for containerization to ensure consistent and reliable packaging across environments, and Redis was implemented as a caching layer to store frequent results, significantly reducing system latency for real-time processing.
3.2.8 Evaluation Metrics
Fraud System Evaluation Metrics Summary
The primary objective was to ensure the system’s effectiveness was measured carefully from both a technical performance and real-world business impact perspective. A comprehensive set of metrics was established to quantify success.
Primary Metrics (Core Algorithm Performance)
These metrics assess the fundamental accuracy and capability of the fraud detection algorithm:

Metric	Definition	Target	Goal
Precision	The proportion of predicted fraud cases that were actually fraudulent.	≥85%
	How accurate the "fraud" flags are.

Recall	The proportion of actual fraud cases correctly identified.	≥90%
	How many true fraud cases the system successfully finds.
F1-Score	The harmonic mean of Precision and Recall.	N/A
	Provides a single, balanced score for overall model performance.
False Positive Rate	The proportion of legitimate transactions incorrectly flagged as fraud.	Closely Monitored
	Minimizes wasted staff time investigating non-fraudulent cases.
Note: In fraud detection, high Recall is often prioritized to ensure fewer fraudulent transactions slip through, even if it slightly lowers Precision (increasing the False Positive Rate).
Performance Metrics (Operational Efficiency)
The Performance Metrics were designed to assess the system's operational efficiency, focusing on speed and resource usage during live processing. Key measures included the Average Inference Time, which is the time required for the system to process and analyze a single transaction, and Throughput, which dictates the total number of transactions the system can successfully handle per minute. Finally, we closely monitored System Resources, specifically memory usage and CPU utilization, to ensure stability and efficiency during peak operational times.
Business Metrics (Real-World Impact)
To quantify the system's real-world impact and return on investment, I defined several Business Metrics. These include measuring the Reduction in Average Investigation Time, which demonstrates how much faster analysts can resolve flagged cases, and Alert Quality, which is calculated as the percentage of system-generated alerts that ultimately lead to a confirmed fraud case. The aggregated effect of these improvements is captured by the Overall Improvement in Operational Efficiency, showing the comprehensive positive impact on business processes and staff productivity.
3.2.9 Results
The machine learning model's performance successfully met and in many cases exceeded the defined targets. The algorithm performance metrics were highly encouraging, with a precision of 87.3%, a recall of 92.1%, and an overall F1-Score of 89.6%. These results confirmed that the model was both accurate in its predictions and effective at identifying the majority of fraudulent transactions. The processing performance was also robust, with an average inference time of 47ms, which was well below the 100ms target, and a peak throughput of 12,500 transactions per minute. A comparative analysis demonstrated the significant improvements of the new system over existing rule-based methods. The new system achieved a 40% improvement in fraud detection accuracy and a substantial 60% reduction in false positive alerts. Furthermore, it led to a 70% decrease in average investigation time and a 50% improvement in operational efficiency.
3.2.10 Model Integration
The machine learning model was carefully integrated into the system architecture for smooth real-time operation. This was achieved through API Integration, using FastAPI to create RESTful API endpoints. These endpoints supported real-time fraud scoring for transactions and batch processing for historical analysis. Security was ensured with JWT authentication and rate limiting. Database Integration with PostgreSQL allowed the model to access transaction data, store predictions, and track performance metrics. Connection pooling and query optimization reduced database performance impact. For real-time processing, the model was embedded in transaction pipelines using message queuing systems to manage high transaction volumes and ensure consistent response times. Comprehensive monitoring and logging provided real-time visibility into predictions, performance, and system health. A model versioning system enabled controlled deployment of updated algorithms with rollback capabilities for system stability.

Chapter 4: Requirements Analysis
This chapter analyzes the requirements for an AI-powered fraud detection system for Malawi's mobile money ecosystem. It translates stakeholder needs and operational constraints into clear technical requirements to guide system design and implementation.
4.1 Introduction
Requirements analysis connects stakeholder needs with technical implementation by identifying, documenting, and validating the capabilities needed for the fraud detection system to tackle mobile money fraud in Malawi. This ensures the system meets operational needs, remains technically feasible, and complies with regulations.  
The analysis used stakeholder interviews, process observation, document analysis, and focus group discussions to understand current fraud detection workflows, system limitations, and desired improvements. These insights were translated into specific functional and non-functional requirements defining the system’s behavior, performance, and constraints.  
The requirements specification forms the basis for system architecture, development, testing, and acceptance criteria, ensuring the system delivers value to mobile money operators, fraud investigators, and regulators. It maintains traceability between stakeholder needs and technical requirements for comprehensive coverage and practical implementation.
4.2 Business Process Analysis
The business process analysis examines the current fraud detection workflows employed by mobile money operators in Malawi. This examination is conducted to identify process inefficiencies, system integration points, and improvement opportunities that will inform the system requirements definition.
4.2.1 Current Fraud Detection Process
The existing fraud detection process is reactive, beginning with automated rule-based transaction monitoring that generates alerts based on predefined thresholds and criteria. These alerts are then queued for manual investigation by fraud analysts. The analysts review transaction details, user history, and contextual information to determine the likelihood of fraud.
Investigation procedures involve a series of manual steps, including transaction pattern analysis, user behavior assessment, geographic consistency verification, and communication with affected users or agents to gather additional information. Confirmed fraud cases require documentation, evidence compilation, case escalation to appropriate authorities, and the implementation of protective measures such as account restrictions or transaction reversals.
The current process demonstrates significant inefficiencies. These include high false positive rates that consume investigation resources, delayed detection that allows fraudulent transactions to be completed, inconsistent investigation procedures that vary between analysts, and limited integration between detection systems and case management tools.
4.2.2 Proposed Process Improvements
The artificial intelligence-powered fraud detection system introduces significant process improvements through several key capabilities. These include real-time transaction analysis that provides immediate fraud risk assessment, automated case prioritization based on risk scores and business impact, integrated investigation workflows that streamline evidence gathering and case documentation, and comprehensive audit trails that support regulatory compliance and performance analysis.
The improved process enables proactive fraud prevention through the immediate blocking of transactions or by requiring additional verification for high-risk transactions. This significantly reduces the window of opportunity for successful fraud completion. The automated risk scoring and case prioritization ensure that investigation resources are focused on the highest-priority cases, while routine, low-risk alerts receive appropriate but efficient processing.
4.2.3 Process Artifacts
The system uses various artifacts to manage fraud detection and investigation effectively. Input artifacts include real-time transaction data from mobile money platforms, historical user behavior databases, user profiles, geographic and time data, and external fraud intelligence feeds. Process artifacts, created during operation, include risk assessment reports with scoring details, investigation case files with evidence, fraud trend analyses, performance dashboards, and audit logs tracking activities. Output artifacts, which help close fraud cases and ensure compliance, consist of fraud confirmation reports with evidence, regulatory reports, performance tracking reports, process improvement suggestions, and training materials for investigators and administrators.
4.3 Technical Section
4.3.1 Use Cases
The system is designed to support multiple use cases that address different aspects of fraud detection and investigation workflows.
 
    

 

 
4.3.2 Data Flow Diagram (DFD)
The system's functionality is best understood through its data flow, which is represented here through a series of diagrams
Level 0 DFD - Context Diagram
 



Level 1 DFD - System Overview
 
Level 2 DFD - Real-Time Analysis Process
 
     

    
4.3.3 Use Case Narratives
Table 1: Real-Time Transaction Analysis
Name: Real-Time Transaction Analysis | ID: UC-001 | Priority: High
Actor:	Mobile Money Platform
Description:	This use case describes a mobile money platform assessing the fraud risk for individual transactions in real-time.
Trigger:	A transaction is initiated on the platform.
Type of trigger:	External
Preconditions:	Transaction data is available and machine learning models are loaded.
Normal course:	1. Platform receives transaction data.
2. System processes data through machine learning models.
3. Risk score is generated within 100 milliseconds.
4. Appropriate action is taken based on risk score.
Postconditions:	A risk score is generated, and an action is executed.
Table 2: Fraud Investigation Management
Name: Fraud Investigation Management | ID: UC-002 | Priority: High
Actor:	Fraud Analyst
Description:	This use case describes a fraud analyst investigating suspicious transactions to determine their fraud status.
Trigger:	An alert is generated for a suspicious transaction.
Type of trigger:	External
Preconditions:	An alert has been generated and the analyst is authenticated.
Normal course:	1. Analyst accesses the alert.
2. Analyst reviews transaction details.
3. Investigation is completed.
4. Case status is updated.
Postconditions:	The investigation is completed, and the case status is updated.

Table 3: System Administration
Name: System Administration | ID: UC-003 | Priority: High
Actor:	System Administrator
Description:	This use case describes a system administrator configuring system parameters and managing user access.
Trigger:	Administrator initiates a configuration or access change.
Type of trigger:	External
Preconditions:	The administrator's privileges have been verified.
Normal course:	1. Administrator accesses configuration interface.
2. Administrator updates system parameters or user access.
3. Configuration is saved and changes are logged.
Postconditions:	The configuration is updated, and changes are logged.
Table 4: Compliance Reporting
Name: Compliance Reporting | ID: UC-004 | Priority: High
Actor:	Compliance Officer
Description:	This use case describes a compliance officer generating regulatory reports and audit documentation.
Trigger:	The reporting period is defined.
Type of trigger:	External
Preconditions:	The reporting period has been defined and necessary data is available.
Normal course:	1. Officer accesses reporting interface.
2. System retrieves relevant data.
3. Reports are generated meeting compliance requirements.
Postconditions:	Reports are generated that meet all compliance requirements.
Table 5: Performance Monitoring
Name: Performance Monitoring | ID: UC-005 | Priority: High
Actor:	System Monitor
Description:	This use case describes a system monitor tracking system performance and detection effectiveness.
Trigger:	Monitoring systems are active and collecting metrics.
Type of trigger:	External
Preconditions:	The monitoring systems are active and metrics are being collected.
Normal course:	1. Monitor accesses performance dashboard.
2. System updates dashboard with current metrics.
3. Alerts are generated if thresholds are exceeded.
Postconditions:	The performance dashboard is updated, and alerts are generated if necessary.

4.3.4 Functional Requirements
ID	Name	Description	Priority
FR-01	Real-Time Transaction Processing
	The system shall process individual transaction risk assessments within 100 milliseconds. It shall support the concurrent processing of up to 10,000 transactions per minute and shall maintain processing performance during peak load conditions.	High
FR-02	Machine Learning Integration	The system shall implement unsupervised learning algorithms for anomaly detection. It shall support model retraining with new fraud patterns and data and shall provide model performance metrics and validation capabilities.	High
FR-03	Alert Generation and Management	The system shall generate prioritized fraud alerts based on risk scores. It shall support configurable alert thresholds and criteria and shall provide alert queue management with assignment capabilities.	High
FR-04	Investigation Workflow Support
	The system shall provide comprehensive case management functionality. It shall integrate evidence compilation and documentation tools and shall support collaborative investigation with multiple analysts.	High
FR-05	User Authentication and Authorization
	The system shall implement multi-factor authentication for user access. It shall enforce role-based access control with granular permissions and shall maintain comprehensive audit logs of user activities.	High
FR-06	Data Integration and Management	The system shall integrate with multiple mobile money platform data sources. It shall support real-time data streaming and batch processing and shall maintain data quality validation and error handling.	High 
FR-07	Reporting and Analytics
	The system shall generate regulatory compliance reports automatically. It shall provide performance analytics and trend analysis and shall support customizable reporting with multiple output formats.	Medium 
FR-08	System Configuration Management
	The system shall support dynamic configuration updates without service interruption. It shall provide configuration version control and rollback capabilities and shall validate configuration changes before implementation.	Medium 

4.3.5 Non-Functional Requirements
Performance Requirements:
NFR-001: Response Time Transaction risk assessment shall complete within 100 milliseconds for 95% of requests. The investigation dashboard shall load within 3 seconds under normal conditions, and report generation shall complete within 30 seconds for standard reports.
NFR-002: Throughput The system shall support processing 10,000 transactions per minute under a sustained load. It shall handle peak loads of 15,000 transactions per minute for 1-hour periods, and the investigation system shall support 50 concurrent analyst sessions.
NFR-003: Scalability The system architecture shall support the horizontal scaling of processing components. The database performance shall maintain response times with a 10x data growth, and the system shall support the addition of new mobile money platform integrations.
Security Requirements:
NFR-004: Data Protection All sensitive data shall be encrypted using AES-256 encryption at rest. All data transmission shall use TLS 1.3 or higher encryption protocols, and personal identifiable information shall be anonymized in analytical datasets.
NFR-005: Access Control The system shall implement role-based access control with the principle of least privilege. User authentication shall require multi-factor verification for sensitive operations, and the system shall maintain comprehensive audit trails of all access and modifications.
NFR-006: System Security The system shall implement intrusion detection and prevention capabilities. All system components shall receive security updates within 48 hours of availability, and the system shall undergo quarterly security assessments and penetration testing.
Usability Requirements:
NFR-007: User Interface The system interface shall be intuitive for users with basic computer literacy. Investigation workflows shall require no more than 5 clicks for common operations, and the system shall provide contextual help and guidance for all major functions.
NFR-008: Accessibility The system interface shall comply with WCAG 2.1 Level AA accessibility standards. The system shall support multiple languages, including English and Chichewa, and shall function effectively on standard business computer configurations.
Reliability Requirements:
NFR-009: Availability The system shall maintain 99.9% uptime during business hours (6 AM - 10 PM). System downtime for maintenance shall not exceed 4 hours per month, and the system shall provide graceful degradation during partial component failures.
NFR-010: Data Integrity The system shall ensure transaction data accuracy through validation and checksums. It shall maintain data consistency across all system components and shall provide automated backup and recovery capabilities.
Compliance Requirements:
NFR-011: Regulatory Compliance The system shall comply with Reserve Bank of Malawi financial services regulations. It shall support data retention policies as required by regulatory authorities and shall provide audit capabilities that meet compliance documentation requirements.
NFR-012: Privacy Protection The system shall implement privacy-by-design principles throughout its architecture. It shall support data subject rights, including access and deletion requests, and shall minimize data collection to information necessary for fraud detection.

