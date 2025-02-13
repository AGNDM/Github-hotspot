import pycountry
import geopy

def standardized_country_name(country_name):
    if country_name is None:
        return None

    # 尝试从 pycountry 库中查找国家代码
    try:
        country_code = pycountry.countries.lookup(country_name).alpha_2
        return pycountry.countries.get(alpha_2=country_code).name
    except LookupError:
        pass

    # 尝试从 geopy 库中查找国家代码
    try:
        geolocator = geopy.Nominatim(user_agent="standardize_country_name")
        location = geolocator.geocode(country_name, language='en')
        return location.address.split(',')[-1].strip()
    except Exception as e:
        return None 