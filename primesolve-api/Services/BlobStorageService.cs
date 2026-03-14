using System;
using System.IO;
using System.Threading.Tasks;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;

namespace PrimeSolve.Api.Services
{
    public class BlobStorageService
    {
        private readonly BlobContainerClient _container;
        private readonly BlobServiceClient _serviceClient;

        public BlobStorageService(IConfiguration configuration)
        {
            var connectionString = configuration["AzureBlobStorage:ConnectionString"];
            var containerName = configuration["AzureBlobStorage:ContainerName"] ?? "documents";
            _serviceClient = new BlobServiceClient(connectionString);
            _container = _serviceClient.GetBlobContainerClient(containerName);
        }

        public async Task<string> UploadProfilePhotoAsync(string tenantId, string clientId, Stream fileStream, string contentType)
        {
            var profileContainer = _serviceClient.GetBlobContainerClient("profile-photos");
            await profileContainer.CreateIfNotExistsAsync(PublicAccessType.None);

            var blobPath = $"{tenantId}/{clientId}/profile.jpg";
            var blobClient = profileContainer.GetBlobClient(blobPath);

            await blobClient.UploadAsync(fileStream, new BlobHttpHeaders
            {
                ContentType = contentType
            });

            return blobClient.Uri.ToString();
        }

        public async Task<string> UploadAsync(string blobPath, IFormFile file)
        {
            await _container.CreateIfNotExistsAsync(PublicAccessType.None);

            var blobClient = _container.GetBlobClient(blobPath);
            using var stream = file.OpenReadStream();

            await blobClient.UploadAsync(stream, new BlobHttpHeaders
            {
                ContentType = file.ContentType
            });

            return blobClient.Uri.ToString();
        }

        public string GetSasUrl(string blobUrl, TimeSpan validFor)
        {
            var blobPath = blobUrl;
            if (blobUrl.StartsWith("http"))
            {
                var uri = new Uri(blobUrl);
                var segments = uri.AbsolutePath.TrimStart('/').Split('/', 2);
                blobPath = segments.Length > 1 ? segments[1] : segments[0];
            }

            var blobClient = _container.GetBlobClient(blobPath);

            if (blobClient.CanGenerateSasUri)
            {
                var sasBuilder = new BlobSasBuilder
                {
                    BlobContainerName = _container.Name,
                    BlobName = blobPath,
                    Resource = "b",
                    ExpiresOn = DateTimeOffset.UtcNow.Add(validFor)
                };
                sasBuilder.SetPermissions(BlobSasPermissions.Read);
                return blobClient.GenerateSasUri(sasBuilder).ToString();
            }

            // Fallback: return the raw blob URL if SAS generation isn't available
            return blobClient.Uri.ToString();
        }

        public async Task<byte[]> DownloadAsync(string blobUrl)
        {
            // Extract blob path from full URL or use as-is if it's a relative path
            var blobPath = blobUrl;
            if (blobUrl.StartsWith("http"))
            {
                var uri = new System.Uri(blobUrl);
                // Remove container name prefix from path
                var segments = uri.AbsolutePath.TrimStart('/').Split('/', 2);
                blobPath = segments.Length > 1 ? segments[1] : segments[0];
            }

            var blobClient = _container.GetBlobClient(blobPath);
            var response = await blobClient.DownloadContentAsync();
            return response.Value.Content.ToArray();
        }
    }
}
