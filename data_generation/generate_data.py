import random
import numpy as np
from datetime import datetime, timedelta
import json
import os
import psycopg2
from psycopg2 import extras
from dotenv import load_dotenv

# --- CONFIGURATION ---
TOTAL_DAYS = 90
BATCH_SIZE = 1000
TRANSACTIONS_PER_DAY_BASE = 11111  # Adjusted for 1,000,000 total
NUM_UNIQUE_USERS = 25_000
ACTIVE_USER_PERCENTAGE = 0.5  # Increased to generate more transactions

TRANSACTION_TYPES_WEIGHTED = [
    ('airtime_purchase', 0.35),
    ('p2p_transfer', 0.25),
    ('cash_out', 0.15),
    ('cash_in', 0.10),
    ('bill_payment', 0.08),
    ('merchant_payment', 0.05),
    ('loan_repayment', 0.02),
    ('bank_to_wallet', 0.02)
]

NETWORK_OPERATORS = [('TNM', 0.55), ('Airtel', 0.45)]

AMOUNT_RANGES = {
    'airtime_purchase': (100, 5000),
    'p2p_transfer': (500, 50000),
    'cash_out': (1000, 100000),
    'cash_in': (1000, 200000),
    'bill_payment': (2000, 50000),
    'merchant_payment': (200, 20000),
    'loan_repayment': (5000, 100000),
    'bank_to_wallet': (5000, 100000)
}

MALAWI_REGIONS = {
    'Central': {'cities': ['Lilongwe', 'Dedza', 'Dowa'], 'weight': 0.45, 'urban_percentage': 0.20},
    'Southern': {'cities': ['Blantyre', 'Zomba', 'Mangochi'], 'weight': 0.45, 'urban_percentage': 0.18},
    'Northern': {'cities': ['Mzuzu', 'Karonga', 'Nkhata Bay'], 'weight': 0.10, 'urban_percentage': 0.15}
}

DEVICE_PATTERNS = {
    'feature_phone': {'weight': 0.70, 'os_types': ['KaiOS', 'proprietary'], 'models': ['Nokia 105', 'Tecno T301']},
    'smartphone': {'weight': 0.30, 'os_types': ['Android'], 'models': ['Samsung A10s', 'Tecno Spark']}
}

ECONOMIC_PATTERNS = {
    'payday_dates': [15, 25, 26, 27, 28, 29, 30],
    'market_days': [5, 12, 19, 26],
    'mothers_day': (10, 15),
    'business_hours': (6, 20),
    'peak_hours': [8, 12, 17]
}

SEASONAL_FACTORS = {
    'harvest_season': {'months': [4, 5, 6], 'transaction_multiplier': 1.4},
    'planting_season': {'months': [11, 12, 1], 'transaction_multiplier': 0.8},
    'lean_season': {'months': [1, 2, 3], 'transaction_multiplier': 0.7}
}

CULTURAL_HOLIDAYS = [datetime(2025, 1, 1), datetime(2025, 3, 3), datetime(2025, 4, 6), datetime(2025, 7, 6), datetime(2025, 10, 15), datetime(2025, 12, 25)]  # Malawi holidays

CURRENCY = 'MWK'
COUNTRY = 'Malawi'
DATE_RANGE = (datetime(2025, 7, 1), datetime(2025, 9, 30))

class RealisticUserProfile:
    def __init__(self, user_id: str):
        self.user_id = user_id  # Phone number as user_id
        self.phone_number = user_id
        self.network_operator = random.choices(*zip(*NETWORK_OPERATORS))[0]
        self.region = random.choices(list(MALAWI_REGIONS.keys()), weights=[r['weight'] for r in MALAWI_REGIONS.values()])[0]
        self.primary_city = random.choice(MALAWI_REGIONS[self.region]['cities'])
        self.device_type = random.choices(*zip(*[(k, v['weight']) for k, v in DEVICE_PATTERNS.items()]))[0]
        self.device_model = random.choice(DEVICE_PATTERNS[self.device_type]['models'])
        self.os_type = random.choice(DEVICE_PATTERNS[self.device_type]['os_types'])
        self.income_level = random.choices(['low', 'medium', 'high'], weights=[0.7, 0.25, 0.05])[0]
        self.transaction_count = 0
        self.total_volume = 0.0
        self.balance = random.uniform(0, 100000)
        self.last_transaction_time = None
        self.device_history = set([self.device_model])
        self.account_created = DATE_RANGE[0] - timedelta(days=random.randint(30, 1095))
        self.daily_transaction_counts = {}
        self.transaction_history = []  # Store past transactions for anomaly detection
        # Use the same name lists for consistency
        first_names = ['Yamikani', 'Moses', 'Daniel', 'Frank', 'Joseph', 'Henry', 'Peter', 'John', 'Michael', 'Chris',
                       'Shadreck', 'Liston', 'Frackson', 'Temwa', 'Chimwemwe', 'Kondwani', 'Taweni', 'Nyangu', 'Ambokile',
                       'Melina', 'Grace', 'Mary', 'Jane', 'Teresa', 'Chisomo', 'Thoko', 'Fatima', 'Aisha', 'Limbani',
                       'Blessings', 'Patrick', 'Gift', 'Elias', 'Steven', 'Andrew', 'Samuel', 'James', 'David', 'Robert',
                       'CATHERINE', 'ROSE', 'PROMISE', 'BRIAN', 'CHARLES', 'ANGELLA', 'JESSICA', 'UCHIZI', 'WILLIAM']
        last_names = ['Banda', 'Phiri', 'Nyirenda', 'Chirwa', 'Mwale', 'Nkhoma', 'Mkandawire', 'Gondwe', 'Kamanga', 'Mhango',
                      'Chitsulo', 'Kambale', 'Kumwenda', 'Maseko', 'Mtonga', 'Munthali', 'Mvula', 'Mwanza', 'Butao', 'Bvumbwe',
                      'Bwanali', 'Chakuamba', 'Charula', 'Chatsika', 'Chauluka', 'Chavula', 'Chawinga', 'Chibambo', 'Chibwana',
                      'Kaunda', 'Kanyika', 'Kaponda', 'Kasambara', 'Katunga', 'Khonje', 'Kumwenda', 'Lungu', 'Manda', 'Msiska',
                      'CHIWAYA', 'MPHASI', 'MSOWOYA', 'KAMPONDA', 'KHUNTHA', 'SILIYA']
        self.name = f"{random.choice(first_names)} {random.choice(last_names)}"

    def _generate_malawi_phone(self) -> str:
        prefixes = ['88', '99']
        prefix = random.choice(prefixes)
        number = ''.join(random.choices('0123456789', k=7))
        return f'265{prefix}{number}'

class MalawiBehavioralDataGenerator:
    def __init__(self):
        self.users = {user['user_id']: RealisticUserProfile(user['user_id']) for user in self._generate_user_data()}
        self.agent_locations = self._initialize_agents()
        self.merchants = self._initialize_merchants()
        self.generated_transaction_ids = set()  # Track generated IDs to ensure uniqueness
        self.transaction_counter = 0  # Global counter for uniqueness

    def _generate_user_data(self) -> list:
        users = []
        phone_numbers = set()
        while len(phone_numbers) < NUM_UNIQUE_USERS:
            prefixes = ['88', '99']
            prefix = random.choice(prefixes)
            number = ''.join(random.choices('0123456789', k=7))
            phone_numbers.add(f'265{prefix}{number}')
        phone_numbers = list(phone_numbers)
        
        for phone in phone_numbers:
            user = {'user_id': phone}
            users.append(user)
        return users

    def _initialize_agents(self) -> dict:
        agents = {}
        total_agents = 2000
        for region, region_data in MALAWI_REGIONS.items():
            region_agent_count = int(total_agents * region_data['weight'])
            for city in region_data['cities']:
                city_agent_count = region_agent_count // len(region_data['cities'])
                for i in range(city_agent_count):
                    agent_id = f"AGT_{region[:3]}_{city[:3]}_{i:03d}"
                    agents[agent_id] = {'city': city, 'region': region}
        return agents

    def _initialize_merchants(self) -> dict:
        merchants = {}
        merchant_types = {'retail_shop': 0.40, 'pharmacy': 0.10, 'market_vendor': 0.20}
        total_merchants = 5000
        for region, region_data in MALAWI_REGIONS.items():
            region_merchant_count = int(total_merchants * region_data['weight'])
            for city in region_data['cities']:
                city_merchants = region_merchant_count // len(region_data['cities'])
                for i in range(city_merchants):
                    merchant_type = random.choices(list(merchant_types.keys()), weights=list(merchant_types.values()))[0]
                    merchant_id = f"MER_{region[:3]}_{city[:3]}_{merchant_type[:3].upper()}_{i:03d}"
                    merchants[merchant_id] = {'type': merchant_type, 'city': city}
        return merchants

    def _get_seasonal_multiplier(self, date: datetime) -> float:
        month = date.month
        for season, data in SEASONAL_FACTORS.items():
            if month in data['months']:
                return data['transaction_multiplier']
        return 1.0

    def _get_time_based_probability(self, hour: int, day_of_week: int) -> float:
        base_prob = 1.0
        if hour in ECONOMIC_PATTERNS['peak_hours']:
            base_prob *= 1.5
        elif hour < 6 or hour > 22:
            base_prob *= 0.1
        elif hour < ECONOMIC_PATTERNS['business_hours'][0] or hour > ECONOMIC_PATTERNS['business_hours'][1]:
            base_prob *= 0.3
        if day_of_week in [5, 6]:
            base_prob *= 0.7
        elif day_of_week in [i-1 for i in ECONOMIC_PATTERNS['market_days']]:
            base_prob *= 1.3
        return base_prob

    def _generate_transaction_id(self, operator: str, timestamp: datetime, txn_type: str) -> str:
        # Increment counter for guaranteed uniqueness
        self.transaction_counter += 1
        counter_str = f"{self.transaction_counter:06d}"  # 6-digit counter with leading zeros
        
        if operator == 'Airtel':
            # Airtel Money format: CO250917.1058.B49830
            date_str = timestamp.strftime('%y%m%d.%H%M')
            prefixes = {
                'airtime_purchase': 'MP',
                'p2p_transfer': 'PP', 
                'cash_out': 'CO',
                'cash_in': 'CI',
                'bill_payment': 'PP',
                'merchant_payment': 'MP',
                'loan_repayment': 'PP',
                'bank_to_wallet': 'BW'
            }
            # Use counter in the ID to ensure uniqueness
            transaction_id = f"{prefixes[txn_type]}{date_str}.{counter_str[:1]}{counter_str[1:]}"
        else:  # TNM
            # TNM Mpamba format: CHB629WCL7I, CH6629I9G70, CGS028TD95E
            prefixes = ['CHB', 'CH', 'CGS', 'CF', 'CBC', 'CHA', 'CHC', 'CHD', 'CHE', 'CHF']
            prefix = random.choice(prefixes)
            # Use counter to ensure uniqueness while maintaining format
            transaction_id = f"{prefix}{counter_str[:3]}{counter_str[3:]}"
        
        # Add to set for tracking (though counter guarantees uniqueness)
        self.generated_transaction_ids.add(transaction_id)
        return transaction_id

    def _generate_name(self) -> str:
        first_names = ['Yamikani', 'Moses', 'Daniel', 'Frank', 'Joseph', 'Henry', 'Peter', 'John', 'Michael', 'Chris',
                       'Shadreck', 'Liston', 'Frackson', 'Temwa', 'Chimwemwe', 'Kondwani', 'Taweni', 'Nyangu', 'Ambokile',
                       'Melina', 'Grace', 'Mary', 'Jane', 'Teresa', 'Chisomo', 'Thoko', 'Fatima', 'Aisha', 'Limbani',
                       'Blessings', 'Patrick', 'Gift', 'Elias', 'Steven', 'Andrew', 'Samuel', 'James', 'David', 'Robert',
                       'CATHERINE', 'ROSE', 'PROMISE', 'BRIAN', 'CHARLES', 'ANGELLA', 'JESSICA', 'UCHIZI', 'WILLIAM']
        last_names = ['Banda', 'Phiri', 'Nyirenda', 'Chirwa', 'Mwale', 'Nkhoma', 'Mkandawire', 'Gondwe', 'Kamanga', 'Mhango',
                      'Chitsulo', 'Kambale', 'Kumwenda', 'Maseko', 'Mtonga', 'Munthali', 'Mvula', 'Mwanza', 'Butao', 'Bvumbwe',
                      'Bwanali', 'Chakuamba', 'Charula', 'Chatsika', 'Chauluka', 'Chavula', 'Chawinga', 'Chibambo', 'Chibwana',
                      'Kaunda', 'Kanyika', 'Kaponda', 'Kasambara', 'Katunga', 'Khonje', 'Kumwenda', 'Lungu', 'Manda', 'Msiska',
                      'CHIWAYA', 'MPHASI', 'MSOWOYA', 'KAMPONDA', 'KHUNTHA', 'SILIYA']
        return f"{random.choice(first_names)} {random.choice(last_names)}"

    def _generate_description(self, operator: str, txn_type: str, amount: float, timestamp: datetime, 
                             sender_name: str, receiver_name: str, receiver_account: str, agent_id: str, reference: str, balance: float) -> str:
        date_str = timestamp.strftime('%d/%m/%Y %H:%M:%S')
        if operator == 'Airtel':
            # Authentic Airtel Money formats
            if txn_type == 'airtime_purchase':
                return f"Trans ID: {reference}. You have paid MK {amount:,.2f} toward Airtel product. Bal:MK {balance:,.2f}."
            elif txn_type == 'p2p_transfer':
                receiver_short = receiver_account[-6:] if receiver_account else '123456'
                return f"Trans ID: {reference}. You have sent MK {amount:,.2f} to {receiver_short},{receiver_name}. Your balance is MK {balance:,.2f}"
            elif txn_type == 'cash_out':
                return f"Trans ID: {reference}. You have withdrawn MK {amount:,.2f} from agent. Your balance is MK {balance:,.2f}"
            elif txn_type == 'cash_in':
                return f"Trans. ID: {reference} You have received MK {amount:,.2f} from agent. Your balance is {balance:,.2f}MK."
            elif txn_type == 'bill_payment':
                return f"Trans ID: {reference}. You have paid MK {amount:,.2f} toward ESCOM bill. Bal:MK {balance:,.2f}."
            elif txn_type == 'merchant_payment':
                return f"Trans ID: {reference}. You have paid MK {amount:,.2f} to merchant. Bal:MK {balance:,.2f}."
            elif txn_type == 'loan_repayment':
                return f"Trans ID: {reference}. Loan repayment MK {amount:,.2f} to FDH Bank. Bal:MK {balance:,.2f}."
            elif txn_type == 'bank_to_wallet':
                return f"Trans. ID: {reference} You have received MK {amount:,.2f} from Bank Account. Your balance is {balance:,.2f}MK."
        else:  # TNM Mpamba - Authentic formats
            if txn_type == 'airtime_purchase':
                return f"You received {amount:,.2f}MWK of Top up from {receiver_account} - {receiver_name} on {date_str} {reference}."
            elif txn_type == 'p2p_transfer':
                return f"Money Sent to {receiver_account} {receiver_name} on {date_str}. Amount: {amount:,.2f}MWK Fee: 65.00MWK Ref: {reference} Bal: {balance:,.2f}MWK"
            elif txn_type == 'cash_out':
                agent_code = agent_id.split('_')[-1] if agent_id else '123456'
                return f"Cash Out from {agent_code}-{sender_name} on {date_str}. Amt: {amount:,.2f}MWK Fee: 0.00MWK Ref: {reference} Bal: {balance:,.2f}MWK"
            elif txn_type == 'cash_in':
                agent_code = agent_id.split('_')[-1] if agent_id else '123456'
                return f"Cash In from {agent_code}-{sender_name} on {date_str}. Amt: {amount:,.2f}MWK Fee: 0.00MWK Ref: {reference} Bal: {balance:,.2f}MWK"
            elif txn_type == 'bill_payment':
                return f"Bill payment {amount:,.2f}MWK to ESCOM on {date_str}. Ref: {reference} Balance: {balance:,.2f}MWK"
            elif txn_type == 'merchant_payment':
                return f"Merchant payment {amount:,.2f}MWK on {date_str}. Ref: {reference} Balance: {balance:,.2f}MWK"
            elif txn_type == 'loan_repayment':
                return f"Loan repayment {amount:,.2f}MWK to FDH Bank on {date_str}. Ref: {reference} Balance: {balance:,.2f}MWK"
            elif txn_type == 'bank_to_wallet':
                banks = ['STANDARD BANK', 'NATIONAL BANK OF MALAWI Plc', 'FDH BANK', 'NBS BANK']
                bank = random.choice(banks)
                return f"Dear customer, you have received {amount:,.2f}MWK from {bank} on {date_str}. Ref: {reference} Balance: {balance:,.2f}MWK"

    def generate_transaction(self, user: RealisticUserProfile, timestamp: datetime) -> dict:
        try:
            txn_type = random.choices([t[0] for t in TRANSACTION_TYPES_WEIGHTED], weights=[w for _, w in TRANSACTION_TYPES_WEIGHTED])[0]
            min_amt, max_amt = AMOUNT_RANGES[txn_type]
            seasonal_mult = self._get_seasonal_multiplier(timestamp)
            amount_mult = 1.5 if timestamp.day in ECONOMIC_PATTERNS['payday_dates'] else seasonal_mult
            amount = round(random.uniform(min_amt, max_amt) * amount_mult, 2)
            
            # Inject random anomalies for testing
            if random.random() < 0.01:  # 1% chance of anomaly
                amount *= random.uniform(5, 20)  # Amplify amount for obvious outlier

            fee = 0.0 if user.network_operator == 'Airtel' and txn_type in ['p2p_transfer', 'airtime_purchase'] else round(amount * 0.015, 2)  # 1.5% fee
            previous_balance = user.balance
            balance = previous_balance - amount - fee if txn_type in ['p2p_transfer', 'cash_out', 'bill_payment', 'merchant_payment', 'loan_repayment'] else previous_balance + amount
            user.balance = balance
            transaction_id = self._generate_transaction_id(user.network_operator, timestamp, txn_type)
            reference = transaction_id[-9:]
            sender_name = user.name
            receiver_name = self._generate_name() if txn_type in ['p2p_transfer', 'airtime_purchase'] else None
            receiver_account = self._generate_receiver_phone(user) if txn_type in ['p2p_transfer', 'airtime_purchase'] else None
            agent_id = self._select_agent(user.primary_city) if txn_type in ['cash_in', 'cash_out'] else None
            
            # Season
            season = {4: 'cool', 5: 'cool', 6: 'cool', 7: 'cool', 11: 'rainy', 12: 'rainy', 1: 'rainy', 2: 'rainy', 3: 'rainy', 8: 'dry', 9: 'dry', 10: 'dry'}.get(timestamp.month, 'dry')

            # Anomaly Detection (increased sensitivity)
            user.transaction_history.append(amount)  # Add current amount to history
            if len(user.transaction_history) > 10:  # Keep last 10 transactions for simplicity
                user.transaction_history.pop(0)
            avg_amount = np.mean(user.transaction_history[:-1]) if user.transaction_history[:-1] else amount  # Exclude current for fair comparison
            std_amount = np.std(user.transaction_history[:-1]) if len(user.transaction_history[:-1]) > 1 else 1000  # Default std if few transactions
            anomaly_score = min(1.0, max(0.0, (abs(amount - avg_amount) / std_amount) / 2))  # Reduced divisor for higher sensitivity
            risk_score = anomaly_score  # For simplicity, align risk with anomaly
            requires_ml_analysis = bool(anomaly_score > 0.3 or user.transaction_count % 50 == 0)  # Lowered threshold to 0.3

            # Convert NumPy types to Python floats
            anomaly_score = float(anomaly_score)
            risk_score = float(risk_score)

            transaction = {
                'transaction_id': transaction_id,
                # user_id will be set to a valid system user (admin/analyst) during insertion to satisfy FK
                'sender_account': user.phone_number,
                'receiver_account': receiver_account if receiver_account else (agent_id if agent_id else None),
                'amount': amount,
                'currency': CURRENCY,
                'timestamp': timestamp.isoformat(),
                'transaction_type': txn_type,
                'location_city': user.primary_city,
                'location_country': COUNTRY,
                'device_type': user.device_type,
                'os_type': user.os_type,
                'status': self._determine_status(user, amount, txn_type),
                'transaction_hour_of_day': timestamp.hour,
                'transaction_day_of_week': timestamp.weekday(),
                'is_weekend': timestamp.weekday() >= 5,
                'is_business_hours': ECONOMIC_PATTERNS['business_hours'][0] <= timestamp.hour <= ECONOMIC_PATTERNS['business_hours'][1],
                'is_payday': timestamp.day in ECONOMIC_PATTERNS['payday_dates'],
                'is_cultural': any(timestamp.date() == holiday.date() for holiday in CULTURAL_HOLIDAYS) or (timestamp.day in ECONOMIC_PATTERNS['market_days'] and amount > 10000),
                'user_total_transactions': user.transaction_count,
                'user_total_amount_spent': user.total_volume,
                'account_age_days': (timestamp - user.account_created).days,
                'is_new_device': user.device_model not in user.device_history,
                'is_new_location': False,
                'fee': fee,
                'balance': balance,
                'reference': reference,
                'sender_name': sender_name,
                'receiver_name': receiver_name,
                'time_since_last_transaction_seconds': (timestamp - user.last_transaction_time).total_seconds() if user.last_transaction_time else 0,
                'daily_transaction_count': user.daily_transaction_counts.get(timestamp.date(), 0) + 1,
                'amount_percentile_for_user': self._calculate_amount_percentile(user, amount),
                'requires_ml_analysis': requires_ml_analysis,
                'anomaly_score': anomaly_score,
                'risk_score': risk_score,
                'season': season,
                # Map telecom-specific fields
                'sender_msisdn': user.phone_number,
                'receiver_msisdn': receiver_account if receiver_account and str(receiver_account).startswith('265') else None,
                'telco_provider': user.network_operator
            }

            if txn_type in ['cash_in', 'cash_out']:
                transaction.update({'agent_id': agent_id, 'merchant_category': 'agent_transaction'})
            elif txn_type == 'merchant_payment':
                merchant_id = self._select_merchant(user.primary_city)
                transaction.update({'merchant_id': merchant_id, 'receiver_account': merchant_id, 'merchant_category': self.merchants[merchant_id]['type']})
            elif txn_type == 'bill_payment':
                transaction.update({'merchant_id': f"BILL_ESCOM", 'merchant_category': 'utility_payment'})
            elif txn_type == 'loan_repayment':
                transaction.update({'merchant_id': f"BILL_FDH", 'merchant_category': 'microfinance'})
            elif txn_type == 'bank_to_wallet':
                transaction.update({'merchant_id': f"BILL_STDBANK", 'merchant_category': 'bank_transfer'})

            if user.last_transaction_time:
                time_diff = (timestamp - user.last_transaction_time).total_seconds()
                transaction['time_since_last_transaction_seconds'] = time_diff
                date_key = timestamp.date()
                if date_key not in user.daily_transaction_counts:
                    user.daily_transaction_counts[date_key] = 0
                user.daily_transaction_counts[date_key] += 1
                transaction['daily_transaction_count'] = user.daily_transaction_counts[date_key]

            user.transaction_count += 1
            user.total_volume += amount
            user.last_transaction_time = timestamp
            user.device_history.add(user.device_model)
            transaction['description'] = self._generate_description(user.network_operator, txn_type, amount, timestamp, sender_name, receiver_name, receiver_account, agent_id, reference, balance)

            return transaction
        except Exception as e:
            print(f"Error generating transaction for user {user.user_id} at {timestamp}: {e}")
            raise

    def _determine_status(self, user: RealisticUserProfile, amount: float, txn_type: str) -> str:
        success_rate = 0.95
        if amount > 500000:
            success_rate *= 0.90
        elif amount > 1000000:
            success_rate *= 0.85
        if txn_type in ['cash_out', 'cash_in']:
            success_rate *= 0.92
        if user.network_operator == 'TNM':
            success_rate *= 0.98
        else:
            success_rate *= 0.96
        rand = random.random()
        if rand < success_rate:
            return 'completed'
        elif rand < success_rate + 0.03:
            return 'pending'
        else:
            return 'failed'

    def _select_agent(self, city: str) -> str:
        city_agents = [aid for aid, agent in self.agent_locations.items() if agent['city'] == city]
        return random.choice(city_agents) if city_agents else list(self.agent_locations.keys())[0]

    def _select_merchant(self, city: str) -> str:
        city_merchants = [mid for mid, merchant in self.merchants.items() if merchant['city'] == city]
        return random.choice(city_merchants) if city_merchants else list(self.merchants.keys())[0]

    def _generate_receiver_phone(self, user: RealisticUserProfile) -> str:
        if random.random() < 0.7:
            network = user.network_operator
        else:
            network = 'TNM' if user.network_operator == 'Airtel' else 'Airtel'
        prefixes = ['880', '881', '882', '883', '884', '885', '995', '996', '997', '998', '999']
        prefix = random.choice(prefixes)
        suffix = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        return f"265{prefix}{suffix}"

    def _calculate_amount_percentile(self, user: RealisticUserProfile, amount: float) -> float:
        if user.transaction_count < 10:
            return 50.0
        avg_amount = user.total_volume / user.transaction_count
        if amount > avg_amount * 3:
            return random.uniform(90, 99)
        elif amount > avg_amount * 2:
            return random.uniform(75, 89)
        elif amount > avg_amount * 1.5:
            return random.uniform(60, 74)
        elif amount < avg_amount * 0.5:
            return random.uniform(1, 25)
        else:
            return random.uniform(26, 59)

def get_db_connection():
    load_dotenv()
    try:
        conn = psycopg2.connect(
            dbname=os.getenv("DB_DATABASE"),
            user=os.getenv("DB_USER"),
            password=os.getenv("DB_PASSWORD"),
            host=os.getenv("DB_HOST"),
            port=os.getenv("DB_PORT")
        )
        return conn
    except psycopg2.OperationalError as e:
        print(f"Database connection error: {e}")
        return None

def generate_realistic_malawi_dataset(num_users: int = NUM_UNIQUE_USERS, 
                                     start_date: datetime = DATE_RANGE[0],
                                     end_date: datetime = DATE_RANGE[1]) -> list:
    generator = MalawiBehavioralDataGenerator()
    print(f"Created {len(generator.users)} realistic user profiles.")
    transactions = []
    current_date = start_date

    try:
        while current_date <= end_date:
            active_user_count = min(int(len(generator.users) * ACTIVE_USER_PERCENTAGE), len(generator.users))
            daily_active_users = random.sample(list(generator.users.values()), active_user_count)
            seasonal_mult = generator._get_seasonal_multiplier(current_date)
            daily_txn_target = int(TRANSACTIONS_PER_DAY_BASE * seasonal_mult)

            print(f"Generating {daily_txn_target} transactions for {current_date.date()}")
            daily_transactions = []
            for hour in range(24):
                hourly_txn_count = daily_txn_target // 24
                actual_hourly_count = int(hourly_txn_count * generator._get_time_based_probability(hour, current_date.weekday()))
                for _ in range(actual_hourly_count):
                    if not daily_active_users:
                        break
                    user = random.choice(daily_active_users)
                    timestamp = current_date.replace(hour=hour, minute=random.randint(0, 59), second=random.randint(0, 59))
                    transaction = generator.generate_transaction(user, timestamp)
                    daily_transactions.append(transaction)
            transactions.extend(daily_transactions)
            
            # Insert transactions daily to reduce memory usage
            if daily_transactions:
                conn = get_db_connection()
                if conn:
                    insert_realistic_transactions(conn, daily_transactions)
                    conn.close()
            current_date += timedelta(days=1)
    except Exception as e:
        print(f"Error generating transactions for {current_date.date()}: {e}")
        raise

    print(f"Generated {len(transactions)} realistic transactions")
    return transactions

def insert_realistic_transactions(conn, transactions: list):
    cursor = conn.cursor()
    # Resolve a valid system user id (admin/analyst) to satisfy FK on transactions.user_id
    cursor.execute("SELECT id FROM users WHERE role IN ('admin','analyst') ORDER BY created_at ASC LIMIT 1;")
    result = cursor.fetchone()
    if not result:
        raise RuntimeError("No admin or analyst user found in 'users' table. Please create one before generating data.")
    system_user_id = result[0]

    columns = [
        'transaction_id', 'user_id', 'amount', 'currency', 'timestamp', 'status',
        'merchant_id', 'transaction_type', 'ip_address', 'is_fraud', 'description',
        'sender_account', 'receiver_account', 'location_city', 'location_country',
        'device_type', 'os_type', 'merchant_category', 'time_since_last_txn_sec',
        'is_new_location', 'is_new_device', 'transaction_hour_of_day', 'transaction_day_of_week',
        'user_total_transactions', 'user_total_amount_spent', 'risk_score', 'sender_msisdn',
        'receiver_msisdn', 'telco_provider'
    ]

    def map_row(txn: dict):
        return [
            txn.get('transaction_id'),  # Add the Malawi transaction ID first
            system_user_id,
            txn.get('amount'),
            txn.get('currency'),
            txn.get('timestamp'),
            txn.get('status'),
            txn.get('merchant_id'),
            txn.get('transaction_type'),
            txn.get('ip_address'),
            False,
            txn.get('description'),
            txn.get('sender_account'),
            txn.get('receiver_account'),
            txn.get('location_city'),
            txn.get('location_country'),
            txn.get('device_type'),
            txn.get('os_type'),
            txn.get('merchant_category'),
            txn.get('time_since_last_transaction_seconds'),
            txn.get('is_new_location'),
            txn.get('is_new_device'),
            txn.get('transaction_hour_of_day'),
            txn.get('transaction_day_of_week'),
            txn.get('user_total_transactions'),
            txn.get('user_total_amount_spent'),
            txn.get('risk_score'),
            txn.get('sender_msisdn'),
            txn.get('receiver_msisdn'),
            txn.get('telco_provider'),
        ]

    data_to_insert = [map_row(txn) for txn in transactions]
    placeholders = ', '.join(['%s'] * len(columns))
    insert_query = f"""
    INSERT INTO transactions ({', '.join(columns)}) 
    VALUES ({placeholders});
    """
    try:
        extras.execute_batch(cursor, insert_query, data_to_insert, page_size=BATCH_SIZE)
        conn.commit()
        print(f"Successfully inserted {len(data_to_insert)} transactions")
    except Exception as e:
        print(f"Error inserting transactions: {e}")
        conn.rollback()
        raise
    finally:
        cursor.close()

def insert_realistic_anomalies(conn, transactions: list):
    """Generate and insert anomalies for high-risk transactions"""
    cursor = conn.cursor()
    
    # Get system user for anomaly creation
    cursor.execute("SELECT id FROM users WHERE role IN ('admin','analyst') ORDER BY created_at ASC LIMIT 1;")
    result = cursor.fetchone()
    system_user_id = result[0] if result else 1
    
    anomaly_columns = [
        'rule_name', 'description', 'severity', 'status', 'timestamp',
        'transaction_id', 'user_id', 'transaction_data', 'risk_score',
        'comments', 'triggered_by'
    ]
    
    anomalies = []
    
    # Generate anomalies for high-risk transactions (risk_score > 0.3)
    for txn in transactions:
        if txn.get('risk_score', 0) > 0.3:
            anomaly_type = random.choice([
                'High Amount Transaction',
                'Unusual Time Pattern', 
                'New Location Activity',
                'Rapid Transaction Sequence',
                'ML Anomaly Detection'
            ])
            
            severity = 'high' if txn.get('risk_score', 0) > 0.7 else 'medium'
            
            description = f"Anomaly detected: {anomaly_type}. Risk Score: {txn.get('risk_score', 0):.3f}"
            if txn.get('amount', 0) > 50000:
                description += f" - High amount: {txn.get('amount', 0):,.0f} MWK"
            
            anomaly = {
                'rule_name': f'ML_{anomaly_type.replace(" ", "_")}',
                'description': description,
                'severity': severity,
                'status': 'open',
                'timestamp': txn.get('timestamp'),
                'transaction_id': txn.get('transaction_id'),
                'user_id': system_user_id,
                'transaction_data': {
                    'amount': txn.get('amount'),
                    'transaction_type': txn.get('transaction_type'),
                    'sender_account': txn.get('sender_account'),
                    'receiver_account': txn.get('receiver_account'),
                    'location_city': txn.get('location_city')
                },
                'risk_score': txn.get('risk_score', 0),
                'comments': [],
                'triggered_by': {
                    'type': 'ML Model',
                    'model': 'IsolationForest',
                    'version': '1.0',
                    'detection_type': anomaly_type
                }
            }
            anomalies.append(anomaly)
    
    if anomalies:
        def map_anomaly_row(anomaly):
            return [
                anomaly['rule_name'],
                anomaly['description'], 
                anomaly['severity'],
                anomaly['status'],
                anomaly['timestamp'],
                anomaly['transaction_id'],
                anomaly['user_id'],
                json.dumps(anomaly['transaction_data']),
                anomaly['risk_score'],
                json.dumps(anomaly['comments']),
                json.dumps(anomaly['triggered_by'])
            ]
        
        anomaly_data = [map_anomaly_row(anomaly) for anomaly in anomalies]
        placeholders = ', '.join(['%s'] * len(anomaly_columns))
        insert_query = f"""
        INSERT INTO anomalies ({', '.join(anomaly_columns)}) 
        VALUES ({placeholders});
        """
        
        try:
            extras.execute_batch(cursor, insert_query, anomaly_data, page_size=BATCH_SIZE)
            conn.commit()
            print(f"Successfully inserted {len(anomaly_data)} anomalies")
        except Exception as e:
            print(f"Error inserting anomalies: {e}")
            conn.rollback()
            raise
    else:
        print("No high-risk transactions found - no anomalies generated")
    
    cursor.close()

if __name__ == "__main__":
    print("Generating realistic Malawi mobile money dataset...")
    conn = get_db_connection()
    if conn:
        print("Connected to database. Generating transactions and anomalies...")
        try:
            with conn.cursor() as cursor:
                # Clear both tables
                cursor.execute("TRUNCATE TABLE anomalies RESTART IDENTITY CASCADE;")
                cursor.execute("TRUNCATE TABLE transactions RESTART IDENTITY CASCADE;")
                conn.commit()
            
            # Generate transactions
            print("📊 Generating transactions...")
            transactions = generate_realistic_malawi_dataset()
            
            # Insert transactions
            print("💾 Inserting transactions...")
            insert_realistic_transactions(conn, transactions)
            
            # Generate and insert anomalies
            print("🚨 Generating anomalies for high-risk transactions...")
            insert_realistic_anomalies(conn, transactions)
            
        except Exception as e:
            print(f"Main execution error: {e}")
        finally:
            conn.close()
        print("✅ Dataset generation complete!")
    else:
        print("Failed to connect to database")
        transactions = generate_realistic_malawi_dataset()
        with open('realistic_malawi_transactions.json', 'w') as f:
            json.dump(transactions, f, default=str, indent=2)
        print("Transactions saved to JSON file")