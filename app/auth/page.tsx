import { redirect } from 'next/navigation';

type SearchParams = Record<string, string | string[] | undefined>;

function appendSearchParams(searchParams: SearchParams) {
  const params = new URLSearchParams();

  Object.entries(searchParams).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => params.append(key, entry));
      return;
    }

    if (value) {
      params.set(key, value);
    }
  });

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
}

export default function AuthPage({ searchParams }: { searchParams: SearchParams }) {
  redirect(`/signin${appendSearchParams(searchParams)}`);
}
