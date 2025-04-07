import traceback
import time
import logging
from typing import Dict, Optional

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

class MCAScraper:
    def __init__(self, headless: bool = True):
        """
        Initialize the MCA web scraper
        
        :param headless: Run Chrome in headless mode
        """
        # Configure logging
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(levelname)s: %(message)s'
        )
        self.logger = logging.getLogger(__name__)
        
        # Setup Chrome options
        self.chrome_options = Options()
        if headless:
            self.chrome_options.add_argument('--headless')
        
        # Additional Chrome options for stability
        self.chrome_options.add_argument('--no-sandbox')
        self.chrome_options.add_argument('--disable-dev-shm-usage')
        self.chrome_options.add_argument('--disable-gpu')
        self.chrome_options.add_argument('--window-size=1920,1080')
        
        # User agent to mimic browser
        self.chrome_options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')
        
        # Create the WebDriver
        self.driver = None

    def setup_driver(self):
        """
        Setup and return a configured Chrome WebDriver
        
        :return: Configured WebDriver
        """
        try:
            service = Service(ChromeDriverManager().install())
            self.driver = webdriver.Chrome(service=service, options=self.chrome_options)
            return self.driver
        except Exception as e:
            self.logger.error(f"Failed to setup WebDriver: {e}")
            self.logger.error(traceback.format_exc())
            raise

    def fetch_company_data(self, company_name_or_cin: str) -> Optional[Dict]:
        """
        Fetch company data from MCA website
        
        :param company_name_or_cin: Company name or CIN to search
        :return: Dictionary of company details or None
        """
        if not self.driver:
            self.setup_driver()
        
        try:
            # Navigate to MCA website (replace with actual URL)
            self.driver.get('https://www.mca.gov.in/content/mca/global/en/mca/master-data/MDS.html')
            
            # Wait for search input to be present
            search_input = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.ID, 'company-search'))
            )
            
            # Enter search term
            search_input.clear()
            search_input.send_keys(company_name_or_cin)
            
            # Find and click search button
            search_button = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.ID, 'search-submit'))
            )
            search_button.click()
            
            # Wait for results
            WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, 'company-result'))
            )
            
            # Extract company details
            company_details = {}
            result_rows = self.driver.find_elements(By.CLASS_NAME, 'company-result')
            
            for row in result_rows:
                # Logic to extract details from each row
                key = row.find_element(By.CLASS_NAME, 'detail-key').text
                value = row.find_element(By.CLASS_NAME, 'detail-value').text
                company_details[key] = value
            
            return company_details
        
        except Exception as e:
            self.logger.error(f"Error fetching company data: {e}")
            self.logger.error(traceback.format_exc())
            return None
        
    def close(self):
        """
        Close the WebDriver
        """
        if self.driver:
            self.driver.quit()

def main():
    """
    Main execution function
    """
    scraper = MCAScraper()
    
    try:
        # Example usage
        company_data = scraper.fetch_company_data('TATA CONSULTANCY SERVICES LIMITED')
        
        if company_data:
            print("Company Details:")
            for key, value in company_data.items():
                print(f"{key}: {value}")
        else:
            print("Failed to fetch company data")
    
    except Exception as e:
        print(f"An error occurred: {e}")
    
    finally:
        scraper.close()

if __name__ == '__main__':
    main()
