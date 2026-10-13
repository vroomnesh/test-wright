# ============================================================================
# ETL SERVICE - EXTRACT TRANSFORM LOAD TEST GENERATION
# ============================================================================
# This service generates comprehensive ETL test cases and scripts:
#
# Manual Configuration Mode:
# - Users define source/target table mappings via UI
# - Specify ETL rules and transformation logic
# - Generate test scripts in multiple languages (SQL, Python, etc.)
#
# Excel Upload Mode:
# - Users upload Excel files with ETL configurations
# - LLM parses and extracts multiple test case scenarios
# - Supports complex mapping configurations and business rules
#
# Output Features:
# - Detailed test scripts with validation logic
# - Excel format with proper test case structure
# - Support for multiple ETL test types and scenarios
# ============================================================================

from typing import List
from models.schemas import SourceTarget, ETLTestResponse
from utils.backend_utils import (
    init_openai, load_env, etl_llm_answer, etl_llm_to_csv, etl_csv_to_excel_bytes,
    read_excel_mapping_sheet, parse_excel_to_etl_config, generate_multiple_etl_test_cases_excel
)

class ETLService:
    def __init__(self):
        pass
    
    async def generate_test_script(
        self,
        sources,  # Can be List[SourceTarget] or list of dicts
        targets,  # Can be List[SourceTarget] or list of dicts
        etl_test_type: str,
        rules: str,
        language: str
    ) -> ETLTestResponse:
        """Generate ETL test script"""
        try:
            # Convert to dicts - handle both Pydantic models and plain dicts
            sources_dict = []
            for source in sources:
                if hasattr(source, 'dict'):
                    # Pydantic model
                    sources_dict.append(source.dict())
                else:
                    # Already a dict
                    sources_dict.append(source)

            targets_dict = []
            for target in targets:
                if hasattr(target, 'dict'):
                    # Pydantic model
                    targets_dict.append(target.dict())
                else:
                    # Already a dict
                    targets_dict.append(target)

            oa = init_openai(load_env())
            script = etl_llm_answer(
                sources=sources_dict,
                targets=targets_dict,
                etl_test_type=etl_test_type,
                rules=rules,
                language=language,
                oa=oa
            )

            return ETLTestResponse(
                success=True,
                script=script,
                language=language
            )

        except Exception as e:
            return ETLTestResponse(
                success=False,
                script=f"Error generating test script: {str(e)}",
                language=language
            )

    async def generate_excel(
        self,
        sources,  # Can be List[SourceTarget] or list of dicts
        targets,  # Can be List[SourceTarget] or list of dicts
        etl_test_type: str,
        rules: str,
        language: str
    ) -> bytes:
        """Generate Excel file with ETL test cases"""
        try:
            # Convert to dicts - handle both Pydantic models and plain dicts
            sources_dict = []
            for source in sources:
                if hasattr(source, 'dict'):
                    # Pydantic model
                    sources_dict.append(source.dict())
                else:
                    # Already a dict
                    sources_dict.append(source)

            targets_dict = []
            for target in targets:
                if hasattr(target, 'dict'):
                    # Pydantic model
                    targets_dict.append(target.dict())
                else:
                    # Already a dict
                    targets_dict.append(target)

            oa = init_openai(load_env())
            csv_text = etl_llm_to_csv(
                sources=sources_dict,
                targets=targets_dict,
                etl_test_type=etl_test_type,
                rules=rules,
                language=language,
                oa=oa
            )

            excel_bytes = etl_csv_to_excel_bytes(csv_text)
            return excel_bytes

        except Exception as e:
            raise Exception(f"Error generating Excel file: {str(e)}")

    async def parse_excel_config(self, excel_file_path: str) -> dict:
        """Parse Excel file and extract multiple ETL test cases using LLM"""
        try:
            # Read Excel data
            excel_data = read_excel_mapping_sheet(excel_file_path)

            # Use LLM to parse and extract multiple test cases
            oa = init_openai(load_env())
            config = parse_excel_to_etl_config(excel_data, oa)

            return {
                "success": True,
                "config": config,
                "message": f"Excel file parsed successfully - {len(config.get('test_cases', []))} test cases found"
            }

        except Exception as e:
            return {
                "success": False,
                "config": None,
                "message": f"Error parsing Excel file: {str(e)}"
            }

    async def generate_excel_from_multiple_test_cases(self, test_cases: list) -> bytes:
        """Generate Excel file with multiple ETL test cases"""
        try:
            oa = init_openai(load_env())
            excel_bytes = generate_multiple_etl_test_cases_excel(test_cases, oa)
            return excel_bytes

        except Exception as e:
            raise Exception(f"Error generating Excel from multiple test cases: {str(e)}")
